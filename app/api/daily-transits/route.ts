// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllPlanetPositions } from '@/lib/astro/ephemerisEngine';
import { RASHIS, NAKSHATRAS } from '@/lib/astro/constants';
import { todayIST, nowIST } from '@/lib/ist-utils';

export const runtime = 'nodejs';
export const revalidate = 0;

// ── Lahiri ayanamsa (same formula as kundliEngine) ──
function getLahiriAyanamsa(jd: number): number {
  const T = (jd - 2415020.0) / 36525.0;
  return 22.4600417 + (50.2388475 / 3600) * T * 100;
}

function normalize(d: number) { return ((d % 360) + 360) % 360; }

function dateToJD(now: Date): number {
  // now is a UTC Date — use UTC accessors
  const y = now.getUTCFullYear(), mo = now.getUTCMonth() + 1, d = now.getUTCDate();
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  let year = y, month = mo;
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + d + h / 24 + B - 1524.5;
}

// Detect simple yogas from transit positions
function detectYogas(sidereal: Record<string, number>): string[] {
  const yogas: string[] = [];

  const guruRashi   = Math.floor(sidereal['Guru']   / 30);
  const shukraRashi = Math.floor(sidereal['Shukra'] / 30);
  if (guruRashi === shukraRashi) yogas.push('Guru-Shukra Yoga');

  const suryaRashi = Math.floor(sidereal['Surya'] / 30);
  const budhRashi  = Math.floor(sidereal['Budh']  / 30);
  if (suryaRashi === budhRashi) yogas.push('Budhaditya Yoga (transit)');

  const moonRashi = Math.floor(sidereal['Chandra'] / 30);
  const adj1 = (moonRashi + 1) % 12;
  const adj2 = (moonRashi + 11) % 12;
  const allRashis = Object.entries(sidereal)
    .filter(([p]) => p !== 'Chandra' && p !== 'Rahu' && p !== 'Ketu')
    .map(([, lon]) => Math.floor(lon / 30));
  if (!allRashis.includes(adj1) && !allRashis.includes(adj2)) {
    yogas.push('Kemadruma Yoga (transit) — avoid major decisions');
  }

  return yogas;
}

export async function GET(_request: NextRequest) {
  const { getAdminClient } = await import('@/lib/supabase/admin');
  const admin = getAdminClient();

  // ── Use IST date as cache key — resets at IST midnight ──
  const today = todayIST();

  const { data: cached } = await admin
    .from('daily_rashifal')
    .select('*')
    .eq('rashi', '_transits')
    .eq('date', today)
    .single();

  if (cached) {
    return NextResponse.json(cached.data);
  }

  // ── Calculate for noon IST = 06:30 UTC ──
  // Use IST "today" string to build the correct noon IST moment
  const noonIST = new Date(`${today}T12:00:00+05:30`); // noon IST
  const jd = dateToJD(noonIST); // dateToJD uses UTC accessors internally

  const ayanamsa = getLahiriAyanamsa(jd);
  const rawPositions = getAllPlanetPositions(jd);
  const sidereal: Record<string, number> = {};

  for (const [planet, raw] of Object.entries(rawPositions)) {
    sidereal[planet] = normalize(raw.longitude - ayanamsa);
  }

  const transitPlanets: Record<string, {
    rashi: string; degrees: number; isRetrograde: boolean; nakshatra: string;
  }> = {};

  for (const [planet, sidLon] of Object.entries(sidereal)) {
    const rashiNum = Math.floor(sidLon / 30);
    const degInRashi = sidLon % 30;
    const nakshatraIndex = Math.floor(sidLon / (360 / 27));
    const raw = rawPositions[planet];
    transitPlanets[planet] = {
      rashi: RASHIS[rashiNum],
      degrees: degInRashi,
      isRetrograde: raw.speed < 0,
      nakshatra: NAKSHATRAS[nakshatraIndex] || '',
    };
  }

  const yogas = detectYogas(sidereal);

  const result = {
    date: today,                               // IST date string
    planets: transitPlanets,
    yogas,
    ayanamsa: parseFloat(ayanamsa.toFixed(4)),
    calculatedAt: nowIST().toISOString(),      // IST timestamp for audit
  };

  // Cache in DB with IST date as key
  await admin.from('daily_rashifal').upsert({
    rashi: '_transits',
    date: today,   // YYYY-MM-DD in IST — cache rolls at IST midnight
    data: result,
  }, { onConflict: 'rashi,date' });

  return NextResponse.json(result);
}
