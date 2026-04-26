// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildRashifalPrompt, type TransitData } from '@/lib/ai/systemPrompt';
import { todayIST, nowIST } from '@/lib/ist-utils';
import Groq from 'groq-sdk';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const { getAdminClient } = await import('@/lib/supabase/admin');
  const admin = getAdminClient();

  const { searchParams } = new URL(request.url);
  const rashi = searchParams.get('rashi');

  if (!rashi) {
    return NextResponse.json({ error: 'Rashi parameter required' }, { status: 400 });
  }

  // ── IST date as cache key — resets at IST midnight, NOT UTC midnight ──
  const today = todayIST();

  // 1. Check rashifal cache (keyed by IST date)
  const { data: cached } = await admin
    .from('daily_rashifal')
    .select('*')
    .eq('rashi', rashi)
    .eq('date', today)
    .single();

  if (cached) {
    return NextResponse.json(cached.data);
  }

  // 2. Fetch today's transits (IST-keyed cache)
  let transits: TransitData | undefined;
  try {
    const { data: transitCache } = await admin
      .from('daily_rashifal')
      .select('data')
      .eq('rashi', '_transits')
      .eq('date', today)    // IST date match
      .single();

    if (transitCache) {
      transits = transitCache.data as TransitData;
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resp = await fetch(`${baseUrl}/api/daily-transits`);
      if (resp.ok) transits = await resp.json();
    }
  } catch {
    // Transits unavailable — proceed without
  }

  // 3. Generate with AI (transit-grounded prompt)
  try {
    const prompt = buildRashifalPrompt(rashi, transits);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.75,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    const rashifalData = JSON.parse(rawContent);

    // Cache with IST date key + IST audit timestamp
    await admin.from('daily_rashifal').upsert({
      rashi,
      date: today,                        // IST date — rolls at IST midnight
      data: rashifalData,
      generated_at: nowIST().toISOString(), // IST timestamp for auditing
    }, { onConflict: 'rashi,date' });

    return NextResponse.json(rashifalData);
  } catch (error) {
    console.error('Rashifal generation error:', error);
    return NextResponse.json({
      general: `Aaj ${rashi} rashi ke liye ek neutral din hai. Apne kaam par dhyan dein.`,
      career: 'Kaam mein steady progress ho raha hai.',
      love: 'Rishton mein samjhauta zaruri hai.',
      health: 'Khana aur paani theek rakhein.',
      lucky: { color: 'Blue', number: 7, time: '10 AM - 12 PM' },
      rating: 3,
    });
  }
}
