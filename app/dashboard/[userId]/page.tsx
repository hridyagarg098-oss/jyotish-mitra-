import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import DashboardClient from './DashboardClient';

interface Props { params: Promise<{ userId: string }> }

export default async function DashboardPage({ params }: Props) {
  const { userId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) redirect('/auth');

  // Fetch kundli + user profile
  const [{ data: kundliRecord }, { data: userProfile }] = await Promise.all([
    adminClient
      .from('kundlis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    adminClient
      .from('users')
      .select('name, dob, tob, pob, plan')
      .eq('id', userId)
      .single(),
  ]);

  if (!kundliRecord) redirect('/kundli');

  // Reconstruct kundli data object for client
  const kundliData = {
    name: userProfile?.name || '',
    dob: userProfile?.dob || '',
    tob: userProfile?.tob || '',
    pob: userProfile?.pob || '',
    lat: 0, lng: 0,
    rashiNum: kundliRecord.rashi_num,
    rashi: kundliRecord.rashi,
    rashiDevanagari: kundliRecord.planet_positions?.Chandra?.rashiDevanagari || '',
    rashiEnglish: kundliRecord.planet_positions?.Chandra?.rashiEnglish || '',
    lagnaNum: kundliRecord.lagna_num,
    lagna: kundliRecord.lagna,
    lagnaDevanagari: kundliRecord.planet_positions?.Surya?.rashiDevanagari || '',
    lagnaEnglish: '',
    nakshatra: kundliRecord.nakshatra,
    nakshatraPada: kundliRecord.nakshatra_pada,
    nakshatraLord: kundliRecord.current_dasha?.lord || 'Shukra',
    planets: kundliRecord.planet_positions,
    dashas: kundliRecord.dasha_periods,
    currentDasha: kundliRecord.current_dasha,
    houseCenters: {},
    calculatedAt: kundliRecord.created_at,
  };

  return (
    <DashboardClient
      kundli={kundliData as any}
      plan={userProfile?.plan || 'free'}
      userId={userId}
    />
  );
}
