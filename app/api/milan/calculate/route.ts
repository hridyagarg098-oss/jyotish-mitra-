import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateKundli } from '@/lib/astro/kundliEngine';
import { calculateGunaMilan } from '@/lib/astro/gunaCalculator';
import { NAKSHATRAS } from '@/lib/astro/constants';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  const { getAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = getAdminClient();
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { partnerName, partnerDob, partnerTob, partnerPob, partnerLat, partnerLng } = body;

    // ── Get user's own kundli ────────────────────────────────────────
    const { data: userKundli } = await adminClient
      .from('kundlis')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!userKundli) {
      return NextResponse.json({ error: 'Pehle apni kundli banayein' }, { status: 400 });
    }

    // ── Calculate partner's kundli ───────────────────────────────────
    const partnerKundli = calculateKundli({
      name: partnerName,
      dob:  partnerDob,
      tob:  partnerTob,
      pob:  partnerPob,
      lat:  partnerLat  || 28.6139,
      lng:  partnerLng  || 77.2090,
    });

    // ── Moon longitudes ──────────────────────────────────────────────
    const userPlanets    = userKundli.planet_positions as any;
    const userMoonLon    = userPlanets?.Chandra?.longitude || 0;
    const userRashiNum   = userKundli.rashi_num;
    const userNakshatra  = userKundli.nakshatra || NAKSHATRAS[Math.floor(userMoonLon / (360 / 27))];
    const userName       = userKundli.name || 'Var';

    const partnerMoonLon   = partnerKundli.planets.Chandra.longitude;
    const partnerRashiNum  = partnerKundli.rashiNum;
    const partnerNakshatra = partnerKundli.nakshatra;

    // ── Guna Milan calculation ───────────────────────────────────────
    const milanResult = calculateGunaMilan(
      userMoonLon, userRashiNum,
      partnerMoonLon, partnerRashiNum,
    );

    // ── AI narrative (concise, real-pandit voice) ────────────────────
    const breakdown = milanResult.gunaBreakdown;
    const kootLines = [
      `Varna: ${breakdown.varna.score}/1`,
      `Vashya: ${breakdown.vashya.score}/2`,
      `Tara: ${breakdown.tara.score}/3`,
      `Yoni: ${breakdown.yoni.score}/4`,
      `Graha Maitri: ${breakdown.grahaMaitri.score}/5`,
      `Gana: ${breakdown.gana.score}/6 — ${breakdown.gana.description}`,
      `Bhakoot: ${breakdown.bhakoot.score}/7${breakdown.bhakoot.score === 0 ? ' — DOSHA' : ''}`,
      `Nadi: ${breakdown.nadi.score}/8${breakdown.nadiDosha ? ' — DOSHA (same nadi!)' : ''}`,
    ].join('\n');

    const narrativePrompt = `Tu Vedic jyotishi hai. Ek sentence mein empathy, phir SEEDHA Milan result batao.

Var: ${userName} | Rashi: ${userKundli.rashi} | Nakshatra: ${userNakshatra}
Vadhu: ${partnerName} | Rashi: ${partnerKundli.rashi} | Nakshatra: ${partnerNakshatra}

Ashtakoot Milan:
${kootLines}
Total: ${milanResult.totalGunas}/36 — ${milanResult.verdict}

${breakdown.nadiDosha ? '⚠️ NADI DOSHA hai — same nadi dono ki.' : ''}
${breakdown.bhakoot.score === 0 ? '⚠️ BHAKOOT DOSHA hai.' : ''}

100-120 words mein natural Hinglish mein realistic milan reading likho:
- Total score aur verdict clearly batao
- Sabse strong koot kaun sa hai aur kya matlab hai (1-2 lines)  
- Sabse kamzor koot aur uska realistic impact (1-2 lines)
- Dosha hai toh specific upay — mantra ya daana (2-3 lines)
- Closing: honest aur hopeful line

Real pandit ki tarah — warm lekin honest. Bullet points NAHI. Flowing sentences.`;

    let narrative = '';
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: narrativePrompt }],
        max_tokens: 280,
        temperature: 0.6,
        top_p: 0.85,
        frequency_penalty: 0.4,
      });
      narrative = completion.choices[0]?.message?.content?.trim() || '';
    } catch (e) {
      console.error('Milan narrative error:', e);
      narrative = `${userName} aur ${partnerName} ka milan ${milanResult.totalGunas}/36 aaya hai — ${milanResult.verdictHinglish}.`;
    }

    // ── Save to DB ───────────────────────────────────────────────────
    const { data: savedMilan } = await adminClient
      .from('milan_results')
      .insert({
        user_id:          user.id,
        partner_name:     partnerName,
        partner_dob:      partnerDob,
        partner_tob:      partnerTob,
        partner_pob:      partnerPob,
        partner_rashi:    partnerKundli.rashi,
        partner_nakshatra: partnerKundli.nakshatra,
        total_gunas:      milanResult.totalGunas,
        guna_breakdown:   milanResult.gunaBreakdown,
        verdict:          milanResult.verdict,
        narrative,
      })
      .select()
      .single();

    return NextResponse.json({
      ...milanResult,
      narrative,
      nadiDosha:   breakdown.nadiDosha,
      bhakutDosha: breakdown.bhakoot.score === 0,
      partnerKundli: {
        rashi:           partnerKundli.rashi,
        rashiDevanagari: partnerKundli.rashiDevanagari,
        lagna:           partnerKundli.lagna,
        nakshatra:       partnerKundli.nakshatra,
        nakshatraPada:   partnerKundli.nakshatraPada,
        currentDasha:    partnerKundli.currentDasha,
      },
      milanId: savedMilan?.id,
    });

  } catch (error) {
    console.error('Milan calculation error:', error);
    return NextResponse.json({ error: 'Milan calculation failed' }, { status: 500 });
  }
}
