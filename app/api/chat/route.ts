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

    // Unlimited chat — no rate limits
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
      .limit(4);                    // last 4 = 2 turns — tight context

    const historyMessages = (chatHistory || []).reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // ── Message array — exact structure as specified ────────────────
    // system → assistant seed (primes voice) → user(kundli) → assistant(kundli ack) → last 4 history → user
    const janmaRashi  = kundliRecord?.rashi || 'your rashi';
    const antardasha  = kundliRecord?.current_dasha?.antardasha?.lord || 'current';

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: PANDIT_SYSTEM_PROMPT,
      },
      // Assistant seed — primes model voice BEFORE user speaks
      {
        role: 'assistant',
        content: 'Haan boliye. Kundli dekh li maine.',
      },
      // Kundli as first user message
      {
        role: 'user',
        content: `Meri janam kundli:\n${kundliContextBlock}`,
      },
      // Second ack with rashi + antardasha — confirms model read it
      {
        role: 'assistant',
        content: kundliRecord
          ? `Achha, dekh liya. ${janmaRashi} rashi hai, ${antardasha} antardasha chal rahi hai abhi. Poochho.`
          : `Kundli nahi mili. Janam taarikh, samay (IST) aur janam sthan batao — phir poora chart dekh ke baat karta hoon.`,
      },
      // Last 4 messages only — 2 turns — tight context
      ...historyMessages,
      {
        role: 'user',
        content: message,
      },
    ];

    // ── Stream — exact parameters as specified ──────────────────────
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 180,          // HARD CAP — 180 tokens ≈ 3-5 sentences in Hindi, cannot be overridden
      temperature: 0.6,         // balanced — not robotic, not hallucinating
      top_p: 0.88,
      frequency_penalty: 0.6,   // HIGH — kills repetitive astrology phrases
      presence_penalty: 0.4,    // forces covering different points each message
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
