// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/ai/systemPrompt';
import { todayIST } from '@/lib/ist-utils';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Lazy-init at request time (not module eval time — avoids build crash)
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
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Get user data + rate limit check
    const { data: userData } = await admin
      .from('users')
      .select('plan, chat_count_today, chat_reset_at')
      .eq('id', user.id)
      .single();

    if (userData) {
      // Use IST date — daily quota resets at IST midnight, not UTC midnight
      const today = todayIST();
      const resetNeeded = userData.chat_reset_at !== today;
      const countToday = resetNeeded ? 0 : (userData.chat_count_today || 0);

      if (userData.plan === 'free' && countToday >= 5) {
        return NextResponse.json({
          error: 'limit_reached',
          message: 'Aapki 5 free messages khatam ho gayi. Pro mein upgrade karein aur unlimited AI Pandit se baat karein! ✨',
        }, { status: 429 });
      }

      if (resetNeeded) {
        await admin.from('users').update({
          chat_count_today: 0,
          chat_reset_at: today,
        }).eq('id', user.id);
      }
    }

    // Build system prompt from kundli data
    let systemPrompt = 'You are Jyotish Mitra, a Vedic astrology AI assistant. Speak in Hinglish. Be warm, specific, and insightful.';

    if (kundliId) {
      const { data: kundliRecord } = await admin
        .from('kundlis')
        .select('*')
        .eq('id', kundliId)
        .eq('user_id', user.id)
        .single();

      if (kundliRecord) {
        const { data: userProfile } = await admin
          .from('users')
          .select('name, dob, tob, pob')
          .eq('id', user.id)
          .single();

        const kundliData = {
          name: userProfile?.name || 'friend',
          dob: userProfile?.dob || '',
          tob: userProfile?.tob || '',
          pob: userProfile?.pob || '',
          lat: 0, lng: 0,
          rashiNum: kundliRecord.rashi_num,
          rashi: kundliRecord.rashi,
          rashiDevanagari: '',
          rashiEnglish: '',
          lagnaNum: kundliRecord.lagna_num,
          lagna: kundliRecord.lagna,
          lagnaDevanagari: '',
          lagnaEnglish: '',
          nakshatra: kundliRecord.nakshatra,
          nakshatraPada: kundliRecord.nakshatra_pada,
          nakshatraLord: kundliRecord.current_dasha?.lord || 'Shukra',
          planets: kundliRecord.planet_positions,
          dashas: kundliRecord.dasha_periods,
          currentDasha: kundliRecord.current_dasha,
          houseCenters: {},
          calculatedAt: kundliRecord.created_at,
        } as any;

        systemPrompt = buildSystemPrompt(kundliData);
      }
    }

    // Get chat history for context
    const { data: chatHistory } = await admin
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const historyMessages = (chatHistory || []).reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Stream from Groq
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: message },
      ],
      max_tokens: 512,
      temperature: 0.7,
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

          await admin.from('chat_messages').insert([
            { user_id: user.id, role: 'user', content: message },
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
