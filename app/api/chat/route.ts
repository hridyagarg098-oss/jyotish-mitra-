// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PANDIT_SYSTEM_PROMPT, buildKundliContext, type TransitData } from '@/lib/ai/systemPrompt';
import { todayIST } from '@/lib/ist-utils';
import type { KundliData } from '@/lib/astro/kundliEngine';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const { getAdminClient } = await import('@/lib/supabase/admin');
  const admin = getAdminClient();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, kundliId } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // ── Rate limiting (IST midnight reset) ──────────────────────────
    const { data: userData } = await admin
      .from('users')
      .select('plan, chat_count_today, chat_reset_at')
      .eq('id', user.id)
      .single();

    if (userData) {
      const today = todayIST();
      const resetNeeded = userData.chat_reset_at !== today;
      const countToday = resetNeeded ? 0 : (userData.chat_count_today || 0);

      if (userData.plan === 'free' && countToday >= 5) {
        return NextResponse.json({
          error: 'limit_reached',
          message: 'Aapki 5 free messages khatam ho gayi hain. Pro mein upgrade karein — unlimited AI Pandit! ✨',
        }, { status: 429 });
      }

      if (resetNeeded) {
        await admin.from('users').update({
          chat_count_today: 0,
          chat_reset_at: today,
        }).eq('id', user.id);
      }
    }

    // ── Fetch user's kundli ─────────────────────────────────────────
    const kundliQuery = kundliId
      ? admin.from('kundlis').select('*').eq('id', kundliId).eq('user_id', user.id).single()
      : admin.from('kundlis').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();

    const { data: kundliRecord } = await kundliQuery;

    // ── Fetch today's transits for context ──────────────────────────
    let transits: TransitData | undefined;
    if (kundliRecord) {
      try {
        const { data: transitCache } = await admin
          .from('daily_rashifal')
          .select('data')
          .eq('rashi', '_transits')
          .eq('date', todayIST())
          .single();
        if (transitCache?.data) transits = transitCache.data as TransitData;
      } catch { /* transits unavailable — proceed without */ }
    }

    // ── Build kundli context block ──────────────────────────────────
    let kundliContextBlock = 'Is user ki kundli abhi available nahi hai. Unse janam taarikh, samay (IST), aur sthan maango — phir kundli banayein.';

    if (kundliRecord) {
      const { data: userProfile } = await admin
        .from('users')
        .select('name, dob, tob, pob')
        .eq('id', user.id)
        .single();

      const storedKundli = {
        name: userProfile?.name || kundliRecord.name || 'Jatak',
        dob:  userProfile?.dob  || kundliRecord.dob  || '',
        tob:  userProfile?.tob  || kundliRecord.tob  || '',
        pob:  userProfile?.pob  || kundliRecord.pob  || '',
        lat: kundliRecord.lat || 0,
        lng: kundliRecord.lng || 0,
        rashiNum:         kundliRecord.rashi_num,
        rashi:            kundliRecord.rashi,
        rashiDevanagari:  '',
        rashiEnglish:     '',
        lagnaNum:         kundliRecord.lagna_num,
        lagna:            kundliRecord.lagna,
        lagnaDevanagari:  '',
        lagnaEnglish:     '',
        lagnaDegree:      kundliRecord.lagna_degree || 0,
        lagnaMinute:      kundliRecord.lagna_minute || 0,
        lagnaSecond:      0,
        lagnaDegreeFormatted: kundliRecord.lagna_degree
          ? `${kundliRecord.lagna_degree}°${String(kundliRecord.lagna_minute || 0).padStart(2,'0')}'`
          : '',
        navamsaLagna:   kundliRecord.navamsa_lagna || '',
        nakshatra:      kundliRecord.nakshatra,
        nakshatraPada:  kundliRecord.nakshatra_pada,
        nakshatraLord:  kundliRecord.current_dasha?.lord || 'Shukra',
        planets:        kundliRecord.planet_positions || {},
        bhavas:         kundliRecord.bhavas || [],
        dashas:         kundliRecord.dasha_periods || [],
        currentDasha:   kundliRecord.current_dasha || {
          lord: 'Shukra', startDate: '', endDate: '',
          antardasha: { lord: 'Shukra', startDate: '', endDate: '', isCurrent: true },
        },
        houseCenters:  {},
        calculatedAt:  kundliRecord.created_at,
      } as KundliData;

      kundliContextBlock = buildKundliContext(storedKundli, transits);
    }

    // ── Last 3 conversation turns (6 messages) ─────────────────────
    const { data: chatHistory } = await admin
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6);                    // 3 pairs max — keep context tight

    const historyMessages = (chatHistory || []).reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // ── Message array — LLaMA 3.3 processes user msgs most strongly ─
    // Architecture: system → kundli briefing (user→assistant pair) → history → current
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: PANDIT_SYSTEM_PROMPT,
      },
      // Kundli as a "briefing" exchange before the real chat
      {
        role: 'user',
        content: kundliContextBlock,
      },
      {
        role: 'assistant',
        content: kundliRecord
          ? `Haan ji, aapki kundli dekh li. Poochho kya jaanna hai.`
          : `Aapki kundli abhi nahi mili. Janam taarikh, samay aur jagah batayein — phir main poora chart dekh ke baat karta hoon.`,
      },
      ...historyMessages,
      {
        role: 'user',
        content: message,
      },
    ];

    // ── Stream with concise settings ────────────────────────────────
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 400,          // HARD LIMIT — forces 4-8 line answers
      temperature: 0.65,        // slight creativity but grounded
      top_p: 0.85,
      frequency_penalty: 0.5,   // STRONG — prevents repetitive astro phrases
      presence_penalty: 0.3,    // encourages covering different angles
      stream: true,
    });

    let fullResponse = '';
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();

          // Persist to DB after stream ends
          await admin.from('chat_messages').insert([
            { user_id: user.id, role: 'user',      content: message },
            { user_id: user.id, role: 'assistant', content: fullResponse },
          ]);

          await admin.rpc('increment_chat_count', { user_id_input: user.id });
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat failed. Please try again.' }, { status: 500 });
  }
}
