import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateKundli } from '@/lib/astro/kundliEngine';

export async function POST(request: NextRequest) {
  const { getAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = getAdminClient();
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, dob, tob, pob, lat, lng } = body;

    if (!name || !dob || !tob || !pob || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate kundli
    const kundliData = calculateKundli({ name, dob, tob, pob, lat, lng });

    // Upsert user profile
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
      .select()
      .single();

    if (kundliError) {
      console.error('Kundli insert error:', kundliError);
      return NextResponse.json({ error: 'Failed to save kundli' }, { status: 500 });
    }

    return NextResponse.json({
      kundliId: kundliRecord.id,
      userId: user.id,
      ...kundliData,
    });
  } catch (error) {
    console.error('Kundli calculation error:', error);
    return NextResponse.json(
      { error: 'Calculation failed. Please try again.' },
      { status: 500 }
    );
  }
}
