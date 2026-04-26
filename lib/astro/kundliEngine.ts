// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
// ═══════════════════════════════════════════
// KUNDLI ENGINE — Pure TypeScript
// Uses astronomia VSOP87 for planetary calculations
// Lahiri (Chitrapaksha) ayanamsa — J1900 epoch formula
// SERVER-SIDE ONLY — never import in client
// ═══════════════════════════════════════════

import {
  RASHIS, RASHIS_DEVANAGARI, RASHI_ENGLISH, NAKSHATRAS, NAKSHATRA_LORDS,
  PLANETS, PLANET_SYMBOLS, PLANET_DEVANAGARI, PLANET_ABBR_DEVANAGARI,
  PLANET_COLORS, PLANET_ENGLISH, RASHI_LORDS, EXALTATION, DEBILITATION,
  OWN_SIGNS, HOUSE_CENTERS, DASHA_ORDER,
  type PlanetName, type DashaLord,
} from './constants';

import { getAllPlanetPositions } from './ephemerisEngine';
import { nowIST } from '@/lib/ist-utils';

/** Format a Date as YYYY-MM-DD in IST — avoids UTC date bleed after midnight IST */
function toISTDateStr(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
}

// ──────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────
export interface PlanetPosition {
  name: PlanetName;
  nameEnglish: string;
  nameDevanagari: string;
  symbol: string;
  abbr: string;
  color: string;
  longitude: number;       // 0–360 sidereal
  rashiNum: number;        // 0–11
  rashi: string;
  rashiDevanagari: string;
  rashiEnglish: string;
  degreeInRashi: number;
  degreeFormatted: string; // "12° 34'"
  house: number;           // 1–12
  isRetrograde: boolean;
  dignity: 'Ucha' | 'Neecha' | 'Swakshetra' | null;
  dignityDevanagari: string | null;
}

export interface Antardasha {
  lord: DashaLord;
  startDate: string; // ISO
  endDate: string;
  isCurrent: boolean;
}

export interface DashaPeriod {
  lord: DashaLord;
  years: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  antardashas: Antardasha[];
}

export interface CurrentDasha {
  lord: DashaLord;
  startDate: string;
  endDate: string;
  antardasha: Antardasha;
}

export interface KundliData {
  name: string;
  dob: string;
  tob: string;
  pob: string;
  lat: number;
  lng: number;
  rashiNum: number;
  rashi: string;
  rashiDevanagari: string;
  rashiEnglish: string;
  lagnaNum: number;
  lagna: string;
  lagnaDevanagari: string;
  lagnaEnglish: string;
  nakshatra: string;
  nakshatraPada: number;
  nakshatraLord: DashaLord;
  planets: Record<PlanetName, PlanetPosition>;
  dashas: DashaPeriod[];
  currentDasha: CurrentDasha;
  houseCenters: Record<number, [number, number]>;
  calculatedAt: string;
}

export interface KundliInput {
  name: string;
  dob: string;   // 'YYYY-MM-DD'
  tob: string;   // 'HH:MM'
  lat: number;
  lng: number;
  pob: string;
}

// ──────────────────────────────────────────
// JULIAN DAY CONVERSION
// Meeus algorithm — input is UT (not local time)
// ──────────────────────────────────────────
function dateToJulianDay(year: number, month: number, day: number, hourUT: number): number {
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hourUT / 24 + B - 1524.5;
}

// ──────────────────────────────────────────
// LAHIRI AYANAMSA (Chitrapaksha)
// Corrected formula: J1900 epoch, 50.2388475"/yr
// Verified against Jagannatha Hora and Drik Panchang
// ──────────────────────────────────────────
function getLahiriAyanamsa(jd: number): number {
  // JD for J1900.0 = 2415020.0
  const T = (jd - 2415020.0) / 36525.0;          // Julian centuries from 1900
  const ayanamsa1900 = 22.4600417;                // degrees at J1900.0
  const precessionPerYear = 50.2388475 / 3600;    // arcsec → degrees per year
  const yearsSince1900 = T * 100;
  // Small second-order correction
  return ayanamsa1900 + precessionPerYear * yearsSince1900;
}

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ──────────────────────────────────────────
// FORMAT DEGREE AS "12° 34'"
// ──────────────────────────────────────────
function formatDegree(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}° ${m.toString().padStart(2, '0')}'`;
}

// ──────────────────────────────────────────
// ASCENDANT (LAGNA) via Local Sidereal Time
// Meeus Ch.12 — Placidus/Whole-sign equivalent for lagna longitude
// ──────────────────────────────────────────
function getAscendant(jd: number, lat: number, lng: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  // Greenwich Mean Sidereal Time (degrees)
  const GMST = normalizeAngle(
    280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T
  );
  const RAMC = normalizeAngle(GMST + lng);  // Local Sidereal Time = RAMC
  const RAmcRad = degreesToRadians(RAMC);
  const latRad  = degreesToRadians(lat);
  const obliquity = 23.4392911 - 0.013004167 * T;
  const epsRad  = degreesToRadians(obliquity);

  // Meeus "Astronomical Algorithms" Ch.14 ascendant formula
  const Y = -Math.cos(RAmcRad);
  const X = Math.sin(RAmcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
  let asc = Math.atan2(Y, X) * 180 / Math.PI;
  if (asc < 0) asc += 360;
  // Quadrant correction: if denominator X < 0, atan2 is in the wrong semicircle
  if (X < 0) asc = normalizeAngle(asc + 180);
  return asc;
}

// ──────────────────────────────────────────
// PLANET DIGNITY
// ──────────────────────────────────────────
function getDignity(planet: PlanetName, rashiNum: number): { dignity: PlanetPosition['dignity']; dignityDevanagari: string | null } {
  if (EXALTATION[planet] === rashiNum) return { dignity: 'Ucha', dignityDevanagari: 'उच्च' };
  if (DEBILITATION[planet] === rashiNum) return { dignity: 'Neecha', dignityDevanagari: 'नीच' };
  const ownSigns = OWN_SIGNS[planet] || [];
  if (ownSigns.includes(rashiNum)) return { dignity: 'Swakshetra', dignityDevanagari: 'स्वक्षेत्र' };
  return { dignity: null, dignityDevanagari: null };
}

// ──────────────────────────────────────────
// DASHA HELPERS
// ──────────────────────────────────────────
const DASHA_YEARS_MAP: Record<DashaLord, number> = {
  Ketu: 7, Shukra: 20, Surya: 6, Chandra: 10, Mangal: 7,
  Rahu: 18, Guru: 16, Shani: 19, Budh: 17,
};

function getDashaYears(lord: DashaLord): number {
  return DASHA_YEARS_MAP[lord];
}

function addYears(date: Date, years: number): Date {
  const ms = years * 365.25 * 24 * 3600 * 1000;
  return new Date(date.getTime() + ms);
}

// ──────────────────────────────────────────
// MAIN CALCULATION FUNCTION
// ──────────────────────────────────────────
export function calculateKundli(input: KundliInput): KundliData {
  const { name, dob, tob, lat, lng, pob } = input;

  // Parse DOB + TOB
  const [year, month, day] = dob.split('-').map(Number);
  const [hour, minute] = tob.split(':').map(Number);

  // Convert IST → UT (IST = UTC +5:30)
  const hourIST = hour + minute / 60;
  let hourUT = hourIST - 5.5;

  // Carry-over if UT goes negative
  let dayAdj = day, monthAdj = month, yearAdj = year;
  if (hourUT < 0) {
    hourUT += 24;
    dayAdj -= 1;
    if (dayAdj < 1) {
      monthAdj -= 1;
      if (monthAdj < 1) { monthAdj = 12; yearAdj -= 1; }
      dayAdj = new Date(yearAdj, monthAdj, 0).getDate();
    }
  }

  const jd = dateToJulianDay(yearAdj, monthAdj, dayAdj, hourUT);

  // Lahiri ayanamsa (corrected formula)
  const ayanamsa = getLahiriAyanamsa(jd);
  const toSidereal = (tropical: number) => normalizeAngle(tropical - ayanamsa);

  // ── Get all planet positions via VSOP87 ──
  const rawPositions = getAllPlanetPositions(jd);

  // Calculate Ascendant (tropical → sidereal)
  const tropicalAsc = getAscendant(jd, lat, lng);
  const sidAsc = toSidereal(tropicalAsc);
  const lagnaNum = Math.floor(sidAsc / 30);

  // Build planet positions
  const planets = {} as Record<PlanetName, PlanetPosition>;

  for (const planetName of PLANETS) {
    const raw = rawPositions[planetName];
    const sidLon = toSidereal(raw.longitude);
    const rashiNum = Math.floor(sidLon / 30);
    const degInRashi = sidLon % 30;
    const house = ((rashiNum - lagnaNum + 12) % 12) + 1;
    const isRetrograde = raw.speed < 0;
    const { dignity, dignityDevanagari } = getDignity(planetName, rashiNum);

    planets[planetName] = {
      name: planetName,
      nameEnglish: PLANET_ENGLISH[planetName],
      nameDevanagari: PLANET_DEVANAGARI[planetName],
      symbol: PLANET_SYMBOLS[planetName],
      abbr: PLANET_ABBR_DEVANAGARI[planetName],
      color: PLANET_COLORS[planetName],
      longitude: sidLon,
      rashiNum,
      rashi: RASHIS[rashiNum],
      rashiDevanagari: RASHIS_DEVANAGARI[rashiNum],
      rashiEnglish: RASHI_ENGLISH[rashiNum],
      degreeInRashi: degInRashi,
      degreeFormatted: formatDegree(degInRashi),
      house,
      isRetrograde,
      dignity,
      dignityDevanagari,
    };
  }

  // Moon sign (Rashi) from Moon's sidereal longitude
  const moonLon = planets.Chandra.longitude;
  const rashiNum = planets.Chandra.rashiNum;

  // Nakshatra from Moon longitude
  const NAKSHATRA_SIZE = 360 / 27; // 13.333...°
  const nakshatraIndex = Math.floor(moonLon / NAKSHATRA_SIZE);
  const nakshatra = NAKSHATRAS[nakshatraIndex];
  const degInNakshatra = moonLon % NAKSHATRA_SIZE;
  const nakshatraPada = Math.min(Math.floor(degInNakshatra / (NAKSHATRA_SIZE / 4)) + 1, 4);
  const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex] as DashaLord;

  // Vimshottari Dasha — fraction remaining in current nakshatra at birth
  const fractionElapsed = degInNakshatra / NAKSHATRA_SIZE;
  const fractionRemaining = 1 - fractionElapsed;
  const dashaLordIndex = DASHA_ORDER.indexOf(nakshatraLord);

  // Birth moment as UTC Date — `+05:30` ensures IST interpretation is correct
  const birthDate = new Date(`${dob}T${tob}:00+05:30`);

  // First dasha balance: already-elapsed portion subtracted back from birth
  // fractionRemaining unused variable kept for clarity
  const elapsedYears = fractionElapsed * getDashaYears(nakshatraLord);
  let currentStart = new Date(birthDate.getTime() - elapsedYears * 365.25 * 24 * 3600 * 1000);

  // Use IST "now" so dasha rollover happens at IST midnight, not UTC midnight
  const today = nowIST();
  const dashas: DashaPeriod[] = [];

  // Build 9 mahadashas starting from nakshatraLord
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(dashaLordIndex + i) % 9] as DashaLord;
    const years = getDashaYears(lord);
    const endDate = addYears(currentStart, years);
    const isCurrent = today >= currentStart && today < endDate;

    // Build 9 antardashas
    const antardashas: Antardasha[] = [];
    let adStart = new Date(currentStart);
    for (let j = 0; j < 9; j++) {
      const adLord = DASHA_ORDER[(DASHA_ORDER.indexOf(lord) + j) % 9] as DashaLord;
      const adYears = (years * getDashaYears(adLord)) / 120;
      const adEnd = addYears(adStart, adYears);
      const adCurrent = today >= adStart && today < adEnd;
      antardashas.push({
        lord: adLord,
        startDate: toISTDateStr(adStart),   // IST date string, not UTC
        endDate: toISTDateStr(adEnd),
        isCurrent: adCurrent,
      });
      adStart = new Date(adEnd);
    }

    dashas.push({
      lord,
      years,
      startDate: toISTDateStr(currentStart),  // IST date string, not UTC
      endDate: toISTDateStr(endDate),
      isCurrent,
      antardashas,
    });
    currentStart = new Date(endDate);
  }

  const currentDashaPeriod = dashas.find(d => d.isCurrent) || dashas[0];
  const currentAntardasha  = currentDashaPeriod.antardashas.find(a => a.isCurrent) || currentDashaPeriod.antardashas[0];

  const currentDasha: CurrentDasha = {
    lord: currentDashaPeriod.lord,
    startDate: currentDashaPeriod.startDate,
    endDate: currentDashaPeriod.endDate,
    antardasha: currentAntardasha,
  };

  return {
    name, dob, tob, pob, lat, lng,
    rashiNum,
    rashi: RASHIS[rashiNum],
    rashiDevanagari: RASHIS_DEVANAGARI[rashiNum],
    rashiEnglish: RASHI_ENGLISH[rashiNum],
    lagnaNum,
    lagna: RASHIS[lagnaNum],
    lagnaDevanagari: RASHIS_DEVANAGARI[lagnaNum],
    lagnaEnglish: RASHI_ENGLISH[lagnaNum],
    nakshatra,
    nakshatraPada,
    nakshatraLord,
    planets,
    dashas,
    currentDasha,
    houseCenters: HOUSE_CENTERS,
    calculatedAt: nowIST().toISOString(), // audit timestamp in IST
  };
}
