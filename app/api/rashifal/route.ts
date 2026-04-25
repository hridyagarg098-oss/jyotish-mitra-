import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { buildRashifalPrompt } from '@/lib/ai/systemPrompt';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const revalidate = 0; // Dynamic

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rashi = searchParams.get('rashi');

  if (!rashi) {
    return NextResponse.json({ error: 'Rashi parameter required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Check DB cache first
  const { data: cached } = await adminClient
    .from('daily_rashifal')
    .select('*')
    .eq('rashi', rashi)
    .eq('date', today)
    .single();

  if (cached) {
    return NextResponse.json(cached.data);
  }

  // Generate with AI
  try {
    const prompt = buildRashifalPrompt(rashi);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    const rashifalData = JSON.parse(rawContent);

    // Cache in DB
    await adminClient.from('daily_rashifal').upsert({
      rashi,
      date: today,
      data: rashifalData,
    }, { onConflict: 'rashi,date' });

    return NextResponse.json(rashifalData);
  } catch (error) {
    // Return fallback data
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
