import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { calculateKundli } from '@/lib/astro/kundliEngine';
import { calculateGunaMilan } from '@/lib/astro/gunaCalculator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { partnerName, partnerDob, partnerTob, partnerPob, partnerLat, partnerLng } = body;

    // Get user's own kundli
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

    // Calculate partner's kundli
    const partnerKundli = calculateKundli({
      name: partnerName,
      dob: partnerDob,
      tob: partnerTob,
      pob: partnerPob,
      lat: partnerLat || 28.6139,
      lng: partnerLng || 77.2090,
    });

    // User moon longitude from saved planets
    const userPlanets = userKundli.planet_positions as any;
    const userMoonLon = userPlanets?.Chandra?.longitude || 0;
    const userRashiNum = userKundli.rashi_num;

    const partnerMoonLon = partnerKundli.planets.Chandra.longitude;
    const partnerRashiNum = partnerKundli.rashiNum;

    // Calculate Guna Milan
    const milanResult = calculateGunaMilan(userMoonLon, userRashiNum, partnerMoonLon, partnerRashiNum);

    // Save to DB
    const { data: savedMilan } = await adminClient
      .from('milan_results')
      .insert({
        user_id: user.id,
        partner_name: partnerName,
        partner_dob: partnerDob,
        partner_tob: partnerTob,
        partner_pob: partnerPob,
        partner_rashi: partnerKundli.rashi,
        partner_nakshatra: partnerKundli.nakshatra,
        total_gunas: milanResult.totalGunas,
        guna_breakdown: milanResult.gunaBreakdown,
        verdict: milanResult.verdict,
      })
      .select()
      .single();

    return NextResponse.json({
      ...milanResult,
      partnerKundli: {
        rashi: partnerKundli.rashi,
        rashiDevanagari: partnerKundli.rashiDevanagari,
        lagna: partnerKundli.lagna,
        nakshatra: partnerKundli.nakshatra,
        nakshatraPada: partnerKundli.nakshatraPada,
        currentDasha: partnerKundli.currentDasha,
      },
      milanId: savedMilan?.id,
    });
  } catch (error) {
    console.error('Milan calculation error:', error);
    return NextResponse.json({ error: 'Milan calculation failed' }, { status: 500 });
  }
}
