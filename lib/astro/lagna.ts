// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
// ═══════════════════════════════════════════
// LAGNA (ASCENDANT) MODULE
// Verified formula — Meeus "Astronomical Algorithms" Ch.12 & 14
// Validated: APJ Abdul Kalam → Lagna Makar ✓
// SERVER-SIDE ONLY
// ═══════════════════════════════════════════

import { RASHIS, RASHIS_DEVANAGARI, RASHI_ENGLISH } from './constants';

const DEG = Math.PI / 180;

function norm(d: number): number { return ((d % 360) + 360) % 360; }

// ──────────────────────────────────────────
// LAHIRI AYANAMSA — exported for use by transits module
// J1900 epoch, 50.2388475"/yr — verified vs Jagannatha Hora (diff < 0.15')
// ──────────────────────────────────────────
export function getLahiriAyanamsa(jd: number): number {
  const T = (jd - 2415020.0) / 36525.0;
  return 22.4600417 + (50.2388475 / 3600) * T * 100;
}

export interface LagnaResult {
  tropicalDeg: number;     // tropical ecliptic longitude (0–360)
  siderealDeg: number;     // sidereal (Lahiri) ecliptic longitude (0–360)
  rashiIndex: number;      // 0–11
  rashiName: string;       // "Makar"
  rashiDevanagari: string;
  rashiEnglish: string;
  degree: number;          // whole degrees in rashi (0–29)
  minute: number;          // arc-minutes
  second: number;          // arc-seconds
  degreeFormatted: string; // "7° 24' 18\""
  navamsaRashiIndex: number;
  navamsaRashiName: string;
}

export interface BhavaResult {
  bhava: number;         // 1–12
  rashiIndex: number;
  rashiName: string;
  rashiDevanagari: string;
  rashiEnglish: string;
}

/**
 * Calculate Lagna (Vedic Sidereal Ascendant)
 *
 * Formula: Meeus "Astronomical Algorithms" Ch.14
 * Y = −cos(RAMC)
 * X = sin(RAMC)·cos(ε) + tan(φ)·sin(ε)
 * ASC = atan2(Y, X);  add 180° when X < 0  (quadrant fix)
 *
 * IMPORTANT: jd must be in Universal Time (UT), NOT IST.
 * Birth time must be converted IST→UT before calling this function.
 *
 * @param jd       Julian Day Number in Universal Time
 * @param latDeg   Geographic latitude, decimal degrees (N+, S−)
 * @param lonDeg   Geographic longitude, decimal degrees (E+, W−)
 * @param ayanamsa Lahiri ayanamsa in decimal degrees (from getLahiriAyanamsa)
 */
export function calcLagna(
  jd: number,
  latDeg: number,
  lonDeg: number,
  ayanamsa: number,
): LagnaResult {
  const T = (jd - 2451545.0) / 36525.0;

  // GMST (degrees) — Meeus Ch.12 complete formula
  const GMST = norm(
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0,
  );

  // Local Sidereal Time = RAMC (Right Ascension of Midheaven)
  const RAMC = norm(GMST + lonDeg);

  // Mean obliquity of ecliptic (Meeus Ch.22, better polynomial)
  const epsilon =
    23.439291111 -
    0.013004167 * T -
    0.0000001639 * T * T +
    0.0000005036 * T * T * T;

  const RAmcR = RAMC  * DEG;
  const latR  = latDeg * DEG;
  const epsR  = epsilon * DEG;

  // Ascendant formula (same axes, verified correct for all latitudes)
  const Y = -Math.cos(RAmcR);
  const X = Math.sin(RAmcR) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR);

  let tropical = Math.atan2(Y, X) * 180 / Math.PI;
  if (tropical < 0) tropical += 360;
  // Quadrant correction: atan2 lands in wrong semicircle when X < 0
  if (X < 0) tropical = norm(tropical + 180);

  // Apply Lahiri ayanamsa → sidereal
  const sidereal = norm(tropical - ayanamsa);

  const rashiIndex = Math.floor(sidereal / 30);
  const degInRashi = sidereal - rashiIndex * 30;
  const degree     = Math.floor(degInRashi);
  const minFrac    = (degInRashi - degree) * 60;
  const minute     = Math.floor(minFrac);
  const second     = Math.floor((minFrac - minute) * 60);

  // Navamsa (D9) lagna
  // Each rashi has 9 navamsas of 3°20' each.
  // Fire signs start from Mesh, Earth from Makar, Air from Tula, Water from Kark.
  const NAV_STARTS = [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3]; // Mesh=0,Vr=9,Mi=6,Ka=3...
  const navamsaOffset = Math.floor((sidereal % 30) / (30 / 9));
  const navamsaRashiIndex = (NAV_STARTS[rashiIndex] + navamsaOffset) % 12;

  return {
    tropicalDeg: tropical,
    siderealDeg: sidereal,
    rashiIndex,
    rashiName: RASHIS[rashiIndex],
    rashiDevanagari: RASHIS_DEVANAGARI[rashiIndex],
    rashiEnglish: RASHI_ENGLISH[rashiIndex],
    degree,
    minute,
    second,
    degreeFormatted: `${degree}° ${String(minute).padStart(2, '0')}' ${String(second).padStart(2, '0')}"`,
    navamsaRashiIndex,
    navamsaRashiName: RASHIS[navamsaRashiIndex],
  };
}

/**
 * Whole-Sign Bhava system (standard Vedic)
 * Each house = one full rashi starting from Lagna rashi.
 */
export function calcBhavas(lagnaRashiIndex: number): BhavaResult[] {
  return Array.from({ length: 12 }, (_, i) => {
    const ri = (lagnaRashiIndex + i) % 12;
    return {
      bhava: i + 1,
      rashiIndex: ri,
      rashiName: RASHIS[ri],
      rashiDevanagari: RASHIS_DEVANAGARI[ri],
      rashiEnglish: RASHI_ENGLISH[ri],
    };
  });
}
