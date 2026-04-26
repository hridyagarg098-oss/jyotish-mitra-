// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { todayIST, nowIST } from '@/lib/ist-utils';
import {
  analyzeGochar, getSadeSatiStatus,
  CHANDRA_GOCHAR_PHALA, calcTithi, getMoonPhase, getTodayVar,
} from '@/lib/astro/gochar';
import Groq from 'groq-sdk';

export const revalidate = 0;
export const runtime = 'nodejs';

const RASHIS = [
  'Mesh','Vrishabh','Mithun','Kark','Simha','Kanya',
  'Tula','Vrishchik','Dhanu','Makar','Kumbh','Meen',
];

// Per-weekday upay templates (lord-specific, so each day's upay is different)
const VAR_UPAY: Record<string, string> = {
  Surya: 'Aaj Aaditya Hridayam padhein ya Surya ko tamba ke lote se arghya dein. Laal chandan tilak lagaayein.',
  Chandra: 'Aaj Shiv ji ko kachcha doodh chadhayein. "Om Som Somaya Namah" — 108 baar. Safed kapde mein baithke jaap karein.',
  Mangal: 'Aaj Hanuman Chalisa padhein ya Mangal Stotram. Laal chandan ya sindoor Bajrangbali ko chadhaayein.',
  Budh: 'Aaj Budh mantra — "Om Budhaya Namah" — 108 baar jaap karein. Hare mung ya sabzi donate karein.',
  Guru: 'Aaj "Om Gram Greem Graum Sah Guruve Namah" — 108 baar. Kisi brahmmin ko peele chawal ya haldi donate karein.',
  Shukra: 'Aaj "Om Shum Shukraya Namah" — 108 baar. Kisi bhi kanya ko mithai ya safed kapda donate karein.',
  Shani: 'Aaj Shani Stotra padhein — "Neelanjana Samabhasam...". Kaale til ka tel kisi garib ko dein ya Shani mandir mein deepak jalayein.',
};

export async function GET(request: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const { getAdminClient } = await import('@/lib/supabase/admin');
  const admin = getAdminClient();

  const { searchParams } = new URL(request.url);
  const rashiParam = searchParams.get('rashi') || 'Mesh';

  // ── Try to get logged-in user's kundli ──────────────────────────
  let janmaRashiIndex = RASHIS.indexOf(rashiParam);
  if (janmaRashiIndex < 0) janmaRashiIndex = 0;

  let janmaRashiName  = rashiParam;
  let nakshatraName   = '';
  let currentDashaStr = '';
  let antardashaLord  = 'Shukra';
  let userId: string | null = null;

  try {
    const { createClient } = await import('@/lib/supabase/server');
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
        janmaRashiIndex = kundliRow.rashi_num ?? janmaRashiIndex;
        janmaRashiName  = kundliRow.rashi ?? janmaRashiName;
        nakshatraName   = kundliRow.nakshatra ?? '';
        const d = kundliRow.current_dasha as any;
        if (d) {
          currentDashaStr = `${d.lord} Mahadasha — ${d.antardasha?.lord ?? ''} Antardasha (ends ${d.antardasha?.endDate ?? ''})`;
          antardashaLord  = d.antardasha?.lord ?? 'Shukra';
        }
      }
    }
  } catch { /* unauthenticated — use rashi param */ }

  // ── Cache key: user+date+antardasha so dasha change forces fresh ─
  const today   = todayIST();
  const cacheKey = userId
    ? `user_${userId}_${today}_${antardashaLord}`
    : `rashi_${janmaRashiName.toLowerCase()}_${today}`;

  // Check cache — delete stale, use fresh
  const { data: cached } = await admin
    .from('daily_rashifal')
    .select('data')
    .eq('rashi', cacheKey)
    .eq('date', today)
    .single();

  if (cached?.data) return NextResponse.json(cached.data);

  // ── Fetch today's transits ───────────────────────────────────────
  let transits: { planet: string; siderealDeg: number; rashi: string; nakshatra: string; degree: number; isRetrograde: boolean }[] = [];
  try {
    const { data: transitCache } = await admin
      .from('daily_rashifal')
      .select('data')
      .eq('rashi', '_transits')
      .eq('date', today)
      .single();

    if (transitCache?.data?.planets) {
      transits = Object.entries(transitCache.data.planets as Record<string, any>).map(([planet, info]: [string, any]) => ({
        planet,
        siderealDeg: (RASHIS.indexOf(info.rashi) * 30) + (Number(info.degrees) || 0),
        rashi: info.rashi,
        nakshatra: info.nakshatra || '',
        degree: Math.floor(Number(info.degrees) || 0),
        isRetrograde: info.isRetrograde || false,
      }));
    } else {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resp = await fetch(`${baseUrl}/api/daily-transits`, { cache: 'no-store' });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.planets) {
          transits = Object.entries(data.planets as Record<string, any>).map(([planet, info]: [string, any]) => ({
            planet,
            siderealDeg: (RASHIS.indexOf(info.rashi) * 30) + (Number(info.degrees) || 0),
            rashi: info.rashi,
            nakshatra: info.nakshatra || '',
            degree: Math.floor(Number(info.degrees) || 0),
            isRetrograde: info.isRetrograde || false,
          }));
        }
      }
    }
  } catch { /* transits unavailable */ }

  // ── Extract key planets for dynamic prompt ───────────────────────
  const moonT  = transits.find(t => t.planet === 'Chandra');
  const sunT   = transits.find(t => t.planet === 'Surya');
  const marsT  = transits.find(t => t.planet === 'Mangal');
  const jupT   = transits.find(t => t.planet === 'Guru');
  const satT   = transits.find(t => t.planet === 'Shani');
  const rahuT  = transits.find(t => t.planet === 'Rahu');
  const venT   = transits.find(t => t.planet === 'Shukra');

  // Moon transit house from janma rashi — this changes every 2.5 days!
  const moonHouse = moonT
    ? ((Math.floor(moonT.siderealDeg / 30) - janmaRashiIndex + 12) % 12) + 1
    : 7;
  const chandraGocharPhala = CHANDRA_GOCHAR_PHALA[moonHouse];

  // Tithi & moon phase (changes daily)
  const tithi     = (moonT && sunT)
    ? calcTithi(moonT.siderealDeg, sunT.siderealDeg)
    : 'Tithi data unavailable';
  const moonPhase = (moonT && sunT)
    ? getMoonPhase(moonT.siderealDeg, sunT.siderealDeg)
    : '';

  // Today's var (weekday) and its lord upay
  const todayVar  = getTodayVar();
  const todayUpay = VAR_UPAY[todayVar.lord] ?? VAR_UPAY.Shani;

  // Classical gochar analysis
  const gocharResults = transits.length > 0 ? analyzeGochar(janmaRashiIndex, transits) : [];
  const sadeSati = satT ? getSadeSatiStatus(janmaRashiIndex, satT.siderealDeg) : null;

  // Key gochar lines for slow planets (most important)
  const keyGocharLines = gocharResults
    .filter(g => ['Shani','Guru','Rahu','Ketu','Mangal'].includes(g.planet))
    .map(g => `• ${g.planet} → ${g.house}ve ghar (${g.transitRashi}) — ${g.result}`)
    .join('\n');

  // ── Build truly dynamic prompt ───────────────────────────────────
  const prompt = `
Aaj ka din: ${today} | ${todayVar.var}var | Tithi: ${tithi} | Chandra avastha: ${moonPhase}

JATAK DATA:
- Janma Rashi: ${janmaRashiName}${nakshatraName ? ` | Nakshatra: ${nakshatraName}` : ''}
${currentDashaStr ? `- Chal Rahi Dasha: ${currentDashaStr}` : ''}
${sadeSati?.isActive ? `⚠️ SADE SATI CHAL RAHI HAI — ${sadeSati.phase}` : ''}

CHANDRA GOCHAR AJ (SABSE IMPORTANT — changes every 2.5 days):
Chandra aaj ${janmaRashiName} rashi se ${moonHouse}ve ghar mein hai (${moonT?.rashi ?? '?'} ${moonT?.degree ?? '?'}°, nakshatra: ${moonT?.nakshatra ?? '?'}).
Phala: ${chandraGocharPhala}

SLOW PLANETS GOCHAR (long-term trends):
${keyGocharLines || '• Gochar data unavailable'}

AGLE PLANETS KI CURRENT POSITION:
• Surya: ${sunT?.rashi ?? '?'} ${sunT?.degree ?? '?'}° (${sunT?.nakshatra ?? '?'})
• Chandra: ${moonT?.rashi ?? '?'} ${moonT?.degree ?? '?'}° → janam rashi se ${moonHouse}ve ghar
• Mangal: ${marsT?.rashi ?? '?'} ${marsT?.degree ?? '?'}°${marsT?.isRetrograde ? ' (Vakri)' : ''}
• Guru: ${jupT?.rashi ?? '?'} ${jupT?.degree ?? '?'}°${jupT?.isRetrograde ? ' (Vakri)' : ''}
• Shani: ${satT?.rashi ?? '?'} ${satT?.degree ?? '?'}°${satT?.isRetrograde ? ' (Vakri)' : ''}
• Rahu: ${rahuT?.rashi ?? '?'} ${rahuT?.degree ?? '?'}°
• Shukra: ${venT?.rashi ?? '?'} ${venT?.degree ?? '?'}°${venT?.isRetrograde ? ' (Vakri)' : ''}

AAJ KA VAR UPAY (${todayVar.var}var — lord: ${todayVar.lord}):
${todayUpay}

Is sabhi CALCULATED astronomical data ke aadhar par ${janmaRashiName} rashi ke liye aaj ka rashifal JSON mein do.

STRICT RULES:
1. Har section mein SPECIFIC graha naam aur unka ghar aana CHAHIYE — "aaj achha din hai" bilkul nahi chalega
2. Chandra ka ${moonHouse}ve ghar gochar MUST drive aaj ka core theme
3. Aaj ka upay SIRF ${todayVar.var}var ka upay hoga — jo upar diya gaya hai wahi use karo exactly
4. ${sadeSati?.isActive ? `Sade Sati (${sadeSati.phase}) ka mention zaroor karo` : ''}
5. Bhasha: natural Hinglish — jaise ek pandit WhatsApp pe type karta hai
6. Har din ka rashifal ALAG hona chahiye — Chandra ki position changes this

Return ONLY this exact JSON (no extra text):
{
  "general": "150-180 word general forecast — Chandra gochar phala core theme + slow planet influence + dasha connection. Specific graha references mandatory.",
  "career": "50 word — which planet and house is driving career today",
  "love": "50 word — Venus/Moon position today and its effect on relationships",
  "health": "40 word — which body part ruled by today's transiting planets needs attention",
  "upay": "${todayUpay}",
  "lucky": { "color": "specific color linked to today's var lord (${todayVar.lord})", "number": <1-9>, "time": "HH:MM-HH:MM" },
  "rating": <1-5>,
  "dominantPlanet": "${moonHouse <= 3 || moonHouse === 6 || moonHouse === 10 || moonHouse === 11 ? 'Chandra' : gocharResults.find(g => !g.isFavorable)?.planet ?? 'Chandra'}",
  "keyTransit": "one sentence: Chandra aaj ${janmaRashiName} rashi se ${moonHouse}ve ghar mein — ${moonHouse > 8 ? 'shubh prabhav' : moonHouse === 8 ? 'kathin din' : 'samanya prabhav'}",
  "moonHouse": ${moonHouse},
  "tithi": "${tithi}",
  "var": "${todayVar.var}var"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Tu Vedic jyotishi hai. Sirf provided astronomical data use kar. Generic baat nahi — specific graha, ghar, aur tithi reference mandatory. Aaj ka upay wahi dena jo user ne diya hai, word-for-word copy karo. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.45,
      top_p: 0.9,
      frequency_penalty: 0.4,
      response_format: { type: 'json_object' },
    });

    const rashifalData = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Force the upay to always match today's var — override AI if it changed it
    rashifalData.upay       = todayUpay;
    rashifalData.moonHouse  = moonHouse;
    rashifalData.tithi      = tithi;
    rashifalData.var        = `${todayVar.var}var`;
    rashifalData._meta      = {
      janmaRashi: janmaRashiName,
      nakshatra: nakshatraName,
      dasha: currentDashaStr,
      sadeSati: sadeSati?.isActive ? sadeSati.phase : null,
      moonHouse,
      tithi,
      isPersonalised: !!userId,
      generatedAt: nowIST().toISOString(),
    };

    // Cache — keyed by user+date+antardasha — rolls at IST midnight
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
      general: `Aaj ${janmaRashiName} rashi ke jatak ke liye Chandra ${moonHouse}ve ghar mein hai — ${chandraGocharPhala}. ${currentDashaStr ? `Aapki ${currentDashaStr} chal rahi hai.` : ''} Apne kaam par dhyan dein.`,
      career: 'Aaj mehnat rang laayegi — patience rakho.',
      love: 'Rishton mein samajhdaari zaruri hai aaj.',
      health: 'Paani adhik peein, vyayaam karein.',
      upay: todayUpay,
      lucky: { color: 'White', number: 7, time: '7:00-9:00' },
      rating: 3,
      dominantPlanet: 'Chandra',
      keyTransit: `Chandra aaj ${janmaRashiName} rashi se ${moonHouse}ve ghar mein hai.`,
      moonHouse,
      tithi,
      var: `${todayVar.var}var`,
    });
  }
}
