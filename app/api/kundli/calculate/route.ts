import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateKundli } from '@/lib/astro/kundliEngine';

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // ── Save to DB (non-fatal — works even if tables don't exist yet) ──
    let kundliId: string | null = null;
    let dbSaved = false;

    try {
      const { getAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = getAdminClient();

      // Ensure user row exists (trigger should handle this, but upsert as safety)
      await adminClient.from('users').upsert({
        id: user.id,
        name,
        email: user.email!,
        dob,
        tob,
        pob,
        lat,
        lng,
      }, { onConflict: 'id' });

      // Insert kundli record
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
        .select('id')
        .single();

      if (kundliError) {
        console.warn('[kundli] DB save failed (non-fatal):', kundliError.message);
      } else {
        kundliId = kundliRecord.id;
        dbSaved = true;
      }
    } catch (dbErr) {
      // DB not set up yet — still return the calculation result
      console.warn('[kundli] DB not available (non-fatal):', dbErr instanceof Error ? dbErr.message : String(dbErr));
    }

    // ── Always return calculated data ───────────────────
    return NextResponse.json({
      kundliId,         // null if DB not set up — client handles this
      userId: user.id,
      dbSaved,          // lets client know if it was persisted
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
