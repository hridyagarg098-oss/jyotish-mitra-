// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { todayIST, nowIST } from '@/lib/ist-utils';
import { analyzeGochar, getSadeSatiStatus } from '@/lib/astro/gochar';
import Groq from 'groq-sdk';

export const revalidate = 0;
export const runtime = 'nodejs';

const RASHIS = [
  'Mesh','Vrishabh','Mithun','Kark','Simha','Kanya',
  'Tula','Vrishchik','Dhanu','Makar','Kumbh','Meen',
];

export async function GET(request: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const { getAdminClient } = await import('@/lib/supabase/admin');
  const admin = getAdminClient();
  const { createClient } = await import('@/lib/supabase/server');

  const { searchParams } = new URL(request.url);
  const rashiParam = searchParams.get('rashi'); // fallback for non-auth rashifal page

  // ── Attempt to get logged-in user's kundli for personalised rashifal ──
  let janmaRashiIndex: number | null = null;
  let janmaRashiName = rashiParam || 'Mesh';
  let nakshatraName  = '';
  let currentDashaStr = '';
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: kundliRow } = await admin
        .from('kundlis')
        .select('rashi_num, rashi, nakshatra, current_dasha')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (kundliRow) {
        janmaRashiIndex = kundliRow.rashi_num;
        janmaRashiName  = kundliRow.rashi || janmaRashiName;
        nakshatraName   = kundliRow.nakshatra || '';
        const d = kundliRow.current_dasha as any;
        if (d) {
          currentDashaStr = `${d.lord} Mahadasha — ${d.antardasha?.lord || ''} Antardasha`;
        }
      }
    }
  } catch {
    // unauthenticated — fall back to rashi param
  }

  // ── IST date as cache key ──
  const today = todayIST();
  const cacheKey = userId
    ? `user_${userId}_${today}`
    : `rashi_${janmaRashiName.toLowerCase()}_${today}`;

  const { data: cached } = await admin
    .from('daily_rashifal')
    .select('data')
    .eq('rashi', cacheKey)
    .eq('date', today)
    .single();

  if (cached?.data) return NextResponse.json(cached.data);

  // ── Fetch today's transits (from cache or calculate) ──
  let transits: { planet: string; siderealDeg: number; rashi: string; nakshatra: string; degree: number; isRetrograde: boolean }[] = [];
  try {
    const { data: transitCache } = await admin
      .from('daily_rashifal')
      .select('data')
      .eq('rashi', '_transits')
      .eq('date', today)
      .single();

    if (transitCache?.data?.planets) {
      // Map stored transit format to our interface
      transits = Object.entries(transitCache.data.planets as Record<string, any>).map(([planet, info]: [string, any]) => ({
        planet,
        siderealDeg: (RASHIS.indexOf(info.rashi) * 30) + (info.degrees || 0),
        rashi: info.rashi,
        nakshatra: info.nakshatra || '',
        degree: Math.floor(info.degrees || 0),
        isRetrograde: info.isRetrograde || false,
      }));
    } else {
      // Trigger transit calculation
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resp = await fetch(`${baseUrl}/api/daily-transits`, { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.planets) {
          transits = Object.entries(data.planets as Record<string, any>).map(([planet, info]: [string, any]) => ({
            planet,
            siderealDeg: (RASHIS.indexOf(info.rashi) * 30) + (info.degrees || 0),
            rashi: info.rashi,
            nakshatra: info.nakshatra || '',
            degree: Math.floor(info.degrees || 0),
            isRetrograde: info.isRetrograde || false,
          }));
        }
      }
    }
  } catch { /* transits unavailable */ }

  // ── Gochar analysis ──
  const rashiIdx = janmaRashiIndex ?? RASHIS.indexOf(janmaRashiName);
  const gocharResults = transits.length > 0 ? analyzeGochar(rashiIdx, transits) : [];

  const saturnTransit = transits.find(t => t.planet === 'Shani');
  const sadeSati = saturnTransit
    ? getSadeSatiStatus(rashiIdx, saturnTransit.siderealDeg)
    : null;

  // ── Build personalised prompt ──
  const isPersonalised = !!userId && !!nakshatraName;

  const transitLines = transits
    .map(t => `  • ${t.planet}: ${t.rashi} ${t.degree}°${t.isRetrograde ? ' (Vakri)' : ''} — ${t.nakshatra}`)
    .join('\n');

  const gocharLines = gocharResults
    .filter(g => ['Shani','Guru','Mangal','Rahu','Ketu'].includes(g.planet))
    .map(g => `  • ${g.planet} ${g.house}ve bhav mein (${g.transitRashi}) — ${g.result}`)
    .join('\n');

  const prompt = `Aaj ka din: ${today}

Jatak ki kundli:
- Janma Rashi: ${janmaRashiName}${nakshatraName ? ` | Nakshatra: ${nakshatraName}` : ''}
${currentDashaStr ? `- Active Dasha: ${currentDashaStr}` : ''}
${sadeSati?.isActive ? `⚠️ Sade Sati chal rahi hai — ${sadeSati.phase}` : ''}

Aaj ke planetary transits (Gochar — noon IST):
${transitLines || '  (Transit data unavailable)'}

Gochar ke janma rashi se ghar aur classical phal:
${gocharLines || '  (Gochar analysis unavailable)'}

In calculated astronomical data ke aadhaar par, ${janmaRashiName} rashi ke jatak ke liye aaj ka PERSONALIZED rashifal JSON mein do.

RULES:
- Har section mein specific graha aur gochar house ka reference hona CHAHIYE
- Generic baat bilkul nahi — jaise "aaj achha din hai" — ye nahi chalega
- Bhasha: natural Hinglish (Hindi + English mix)
${sadeSati?.isActive ? '- Sade Sati ka mention zaroor karo with specific advice' : ''}

Return ONLY this exact JSON:
{
  "general": "150 word general forecast mentioning specific planets",
  "career": "60 word career forecast with planet reference",
  "love": "60 word love/relationship forecast",
  "health": "50 word health forecast",
  "upaya": "one specific remedy with exact mantra/donation for today's dominant planet",
  "lucky": { "color": "color name", "number": 1-9, "time": "HH:MM-HH:MM" },
  "rating": 1-5,
  "dominantPlanet": "planet name most influencing today",
  "keyTransit": "one sentence about the most important transit"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.45,
      top_p: 0.9,
      response_format: { type: 'json_object' },
    });

    const rashifalData = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Annotate with metadata
    rashifalData._meta = {
      janmaRashi: janmaRashiName,
      nakshatra: nakshatraName,
      dasha: currentDashaStr,
      sadeSati: sadeSati?.isActive ? sadeSati.phase : null,
      isPersonalised,
      generatedAt: nowIST().toISOString(),
    };

    // Cache with IST date — rolls at IST midnight
    await admin.from('daily_rashifal').upsert({
      rashi: cacheKey,
      date: today,
      data: rashifalData,
      generated_at: nowIST().toISOString(),
    }, { onConflict: 'rashi,date' });

    return NextResponse.json(rashifalData);

  } catch (error) {
    console.error('Rashifal generation error:', error);
    return NextResponse.json({
      general: `Aaj ${janmaRashiName} rashi ke liye ek saamanya din hai. Apne kaam par dhyan dein aur graha shanti ke liye mantra jaap karein.`,
      career: 'Mehnat rang laayegi — patience rakho.',
      love: 'Rishton mein samajhdaari zaruri hai.',
      health: 'Paani adhik peein, vyayaam karein.',
      upaya: 'Aaj subah surya ko arghya dein aur "Om Namah Shivaya" 108 baar japein.',
      lucky: { color: 'White', number: 1, time: '7:00-9:00' },
      rating: 3,
      dominantPlanet: 'Surya',
      keyTransit: 'Transits aaj saamanya hain.',
    });
  }
}
