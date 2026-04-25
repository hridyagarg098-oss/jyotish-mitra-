import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateKundli } from '@/lib/astro/kundliEngine';

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[kundli] Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Login karein pehle — session expire ho gayi hai' },
        { status: 401 }
      );
    }

    // ── Validate body ───────────────────────────────────
    const body = await request.json();
    const { name, dob, tob, pob, lat, lng } = body;

    if (!name || !dob || !tob || !pob || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Sabhi fields bharo: naam, janm tithi, janm samay, aur janm sthan' },
        { status: 400 }
      );
    }

    // ── Admin client ────────────────────────────────────
    const { getAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = getAdminClient();

    // ── Calculate kundli ────────────────────────────────
    let kundliData;
    try {
      kundliData = calculateKundli({ name, dob, tob, pob, lat, lng });
    } catch (calcErr) {
      console.error('[kundli] Calculation error:', calcErr);
      return NextResponse.json(
        { error: `Calculation mein problem: ${calcErr instanceof Error ? calcErr.message : String(calcErr)}` },
        { status: 500 }
      );
    }

    // ── Ensure user row exists ──────────────────────────
    // The trigger auto-creates the row on signup, but upsert here as safety net
    const { error: userUpsertError } = await adminClient.from('users').upsert({
      id: user.id,
      name,
      email: user.email!,
      dob,
      tob,
      pob,
      lat,
      lng,
    }, { onConflict: 'id' });

    if (userUpsertError) {
      // Non-fatal: log but continue — user row might already exist with correct data
      console.warn('[kundli] User upsert warning:', userUpsertError.message);
    }

    // ── Save kundli ─────────────────────────────────────
    const { data: kundliRecord, error: kundliError } = await adminClient
      .from('kundlis')
      .insert({
        user_id: user.id,
        rashi: kundliData.rashi,
        rashi_num: kundliData.rashiNum,
        lagna: kundliData.lagna,
        lagna_num: kundliData.lagnaNum,
        nakshatra: kundliData.nakshatra,
        nakshatra_pada: kundliData.nakshatraPada,
        planet_positions: kundliData.planets,
        dasha_periods: kundliData.dashas,
        current_dasha: kundliData.currentDasha,
      })
      .select()
      .single();

    if (kundliError) {
      console.error('[kundli] DB insert error:', kundliError);
      return NextResponse.json(
        { error: `Database error: ${kundliError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      kundliId: kundliRecord.id,
      userId: user.id,
      ...kundliData,
    });

  } catch (error) {
    console.error('[kundli] Unexpected error:', error);
    return NextResponse.json(
      { error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
