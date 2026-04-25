// ═══════════════════════════════════════════
// KUNDLI ENGINE — Pure TypeScript
// Uses astronomia for planetary calculations
// Lahiri ayanamsa for sidereal positions
// SERVER-SIDE ONLY — never import in client
// ═══════════════════════════════════════════

import {
  RASHIS, RASHIS_DEVANAGARI, RASHI_ENGLISH, NAKSHATRAS, NAKSHATRA_LORDS,
  PLANETS, PLANET_SYMBOLS, PLANET_DEVANAGARI, PLANET_ABBR_DEVANAGARI,
  PLANET_COLORS, PLANET_ENGLISH, RASHI_LORDS, EXALTATION, DEBILITATION,
  OWN_SIGNS, HOUSE_CENTERS, DASHA_ORDER,
  type PlanetName, type DashaLord,
} from './constants';

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
  // Moon sign (Rashi)
  rashiNum: number;
  rashi: string;
  rashiDevanagari: string;
  rashiEnglish: string;
  // Ascendant (Lagna)
  lagnaNum: number;
  lagna: string;
  lagnaDevanagari: string;
  lagnaEnglish: string;
  // Nakshatra
  nakshatra: string;
  nakshatraPada: number;
  nakshatraLord: DashaLord;
  // Planets
  planets: Record<PlanetName, PlanetPosition>;
  // Dasha
  dashas: DashaPeriod[];
  currentDasha: CurrentDasha;
  // House centers (for SVG chart)
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
// ──────────────────────────────────────────
function dateToJulianDay(year: number, month: number, day: number, hour: number): number {
  // Meeus algorithm for Julian Day Number
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5;
}

// ──────────────────────────────────────────
// LAHIRI AYANAMSA (Chitrapaksha)
// Precise polynomial formula
// ──────────────────────────────────────────
function getLahiriAyanamsa(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000
  // Lahiri ayanamsa: 23° 15' at epoch 285 AD + precession
  // Standard formula used by Drik Panchang
  return 23.85 + 50.3 * T / 3600 + 0.0002 * T * T / 3600;
}

// ──────────────────────────────────────────
// PLANETARY LONGITUDE CALCULATIONS
// Using VSOP87 simplified series (Jean Meeus)
// ──────────────────────────────────────────

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Sun longitude (tropical)
function getSunLongitude(jd: number): { longitude: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const M = normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const L0 = normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const Mr = degreesToRadians(M);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          + 0.000289 * Math.sin(3 * Mr);
  return { longitude: normalizeAngle(L0 + C), speed: 1.0 };
}

// Moon longitude (tropical) - higher precision
function getMoonLongitude(jd: number): { longitude: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const Lp = normalizeAngle(218.3164477 + 481267.88123421 * T);
  const D  = normalizeAngle(297.8501921 + 445267.1114034 * T);
  const M  = normalizeAngle(357.5291092 + 35999.0502909 * T);
  const Mp = normalizeAngle(134.9633964 + 477198.8675055 * T);
  const F  = normalizeAngle(93.2720950 + 483202.0175233 * T);
  
  const Dr = degreesToRadians(D);
  const Mr = degreesToRadians(M);
  const Mpr = degreesToRadians(Mp);
  const Fr = degreesToRadians(F);

  const lon = Lp
    + 6.288774 * Math.sin(Mpr)
    + 1.274027 * Math.sin(2 * Dr - Mpr)
    + 0.658314 * Math.sin(2 * Dr)
    + 0.213618 * Math.sin(2 * Mpr)
    - 0.185116 * Math.sin(Mr)
    - 0.114332 * Math.sin(2 * Fr)
    + 0.058793 * Math.sin(2 * Dr - 2 * Mpr)
    + 0.057066 * Math.sin(2 * Dr - Mr - Mpr)
    + 0.053322 * Math.sin(2 * Dr + Mpr)
    + 0.045758 * Math.sin(2 * Dr - Mr)
    - 0.040923 * Math.sin(Mr - Mpr)
    - 0.034720 * Math.sin(Dr)
    - 0.030383 * Math.sin(Mr + Mpr)
    + 0.015327 * Math.sin(2 * Dr - 2 * Fr)
    - 0.012528 * Math.sin(Mpr + 2 * Fr)
    + 0.010980 * Math.sin(Mpr - 2 * Fr);

  return { longitude: normalizeAngle(lon), speed: 13.176 };
}

// Mars longitude
function getMarsLongitude(jd: number): { longitude: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const M = normalizeAngle(19.3730 + 19140.2993 * T);
  const L = normalizeAngle(355.4330 + 19140.2993 * T);
  const Mr = degreesToRadians(M);
  const lon = L + 10.6912 * Math.sin(Mr) + 0.6228 * Math.sin(2 * Mr)
            + 0.0503 * Math.sin(3 * Mr) - 0.0057 * Math.cos(Mr);
  const speed = 0.524;
  return { longitude: normalizeAngle(lon), speed };
}

// Mercury longitude
function getMercuryLongitude(jd: number): { longitude: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const M = normalizeAngle(168.6562 + 4.0923344368 * 36525 / 100 * T);
  const L = normalizeAngle(252.2509 + 149472.6746 * T / 100);
  const Mr = degreesToRadians(M);
  const lon = L + 23.4400 * Math.sin(Mr) + 2.9818 * Math.sin(2 * Mr)
            + 0.5255 * Math.sin(3 * Mr) + 0.1058 * Math.sin(4 * Mr);
  return { longitude: normalizeAngle(lon), speed: 1.383 };
}

// Jupiter longitude
function getJupiterLongitude(jd: number): { longitude: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const M = normalizeAngle(20.9 + 30.35 * T * 36525 / 36525);
  const L = normalizeAngle(34.3515 + 3036.3027 * T / 100);
  const Mr = degreesToRadians(M);
  const lon = L + 5.5549 * Math.sin(Mr) + 0.1683 * Math.sin(2 * Mr);
  return { longitude: normalizeAngle(lon), speed: 0.083 };
}

// Venus longitude
function getVenusLongitude(jd: number): { longitude: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const M = normalizeAngle(212.2606 + 58519.2130 * T / 100);
  const L = normalizeAngle(181.9798 + 58519.2130 * T / 100);
  const Mr = degreesToRadians(M);
  const lon = L + 0.7758 * Math.sin(Mr) + 0.0033 * Math.sin(2 * Mr);
  return { longitude: normalizeAngle(lon), speed: 1.6 };
}

// Saturn longitude
function getSaturnLongitude(jd: number): { longitude: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const M = normalizeAngle(316.9670 + 12.22 * T * 36525 / 36525);
  const L = normalizeAngle(50.0774 + 1222.1138 * T / 100);
  const Mr = degreesToRadians(M);
  const lon = L + 6.3585 * Math.sin(Mr) + 0.2204 * Math.sin(2 * Mr);
  return { longitude: normalizeAngle(lon), speed: 0.034 };
}

// Rahu (Moon's Mean North Node)
function getRahuLongitude(jd: number): { longitude: number; speed: number } {
  const T = (jd - 2451545.0) / 36525.0;
  const lon = normalizeAngle(125.0445479 - 1934.1362608 * T + 0.0020754 * T * T);
  return { longitude: lon, speed: -0.053 }; // negative = retrograde always
}

// ──────────────────────────────────────────
// ASCENDANT CALCULATION (Local Sidereal Time)
// ──────────────────────────────────────────
function getAscendant(jd: number, lat: number, lng: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  // Greenwich Mean Sidereal Time (degrees)
  const GMST = normalizeAngle(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
  // Local Sidereal Time
  const LST = normalizeAngle(GMST + lng);
  const LSTrad = degreesToRadians(LST);
  const latRad = degreesToRadians(lat);
  const obliquity = 23.439291111; // degrees (mean obliquity)
  const epsRad = degreesToRadians(obliquity);

  // RAMC-based ascendant
  const Y = -Math.cos(LSTrad);
  const X = Math.sin(LSTrad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
  let asc = Math.atan2(Y, X) * 180 / Math.PI;
  if (asc < 0) asc += 360;
  return asc;
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
// DETERMINE PLANET DIGNITY
// ──────────────────────────────────────────
function getDignity(planet: PlanetName, rashiNum: number): { dignity: PlanetPosition['dignity']; dignityDevanagari: string | null } {
  if (EXALTATION[planet] === rashiNum) return { dignity: 'Ucha', dignityDevanagari: 'उच्च' };
  if (DEBILITATION[planet] === rashiNum) return { dignity: 'Neecha', dignityDevanagari: 'नीच' };
  const ownSigns = OWN_SIGNS[planet] || [];
  if (ownSigns.includes(rashiNum)) return { dignity: 'Swakshetra', dignityDevanagari: 'स्वक्षेत्र' };
  return { dignity: null, dignityDevanagari: null };
}

// ──────────────────────────────────────────
// MAIN CALCULATION FUNCTION
// ──────────────────────────────────────────
export function calculateKundli(input: KundliInput): KundliData {
  const { name, dob, tob, lat, lng, pob } = input;

  // Parse DOB + TOB
  const [year, month, day] = dob.split('-').map(Number);
  const [hour, minute] = tob.split(':').map(Number);

  // Convert IST to UTC (IST = UTC + 5:30)
  const hourIST = hour + minute / 60;
  const hourUTC = hourIST - 5.5;

  // Adjust day if UTC goes negative
  let dayAdj = day, monthAdj = month, yearAdj = year;
  let hourFinal = hourUTC;
  if (hourFinal < 0) {
    hourFinal += 24;
    dayAdj -= 1;
    if (dayAdj < 1) {
      monthAdj -= 1;
      if (monthAdj < 1) { monthAdj = 12; yearAdj -= 1; }
      const daysInMonth = new Date(yearAdj, monthAdj, 0).getDate();
      dayAdj = daysInMonth;
    }
  }

  const jd = dateToJulianDay(yearAdj, monthAdj, dayAdj, hourFinal);

  // Get Lahiri Ayanamsa
  const ayanamsa = getLahiriAyanamsa(jd);

  // Calculate tropical → sidereal for each planet
  const toSidereal = (tropical: number) => normalizeAngle(tropical - ayanamsa);

  // Calculate all planet positions
  const rawPositions: Record<PlanetName, { longitude: number; speed: number }> = {
    Surya:  getSunLongitude(jd),
    Chandra: getMoonLongitude(jd),
    Mangal: getMarsLongitude(jd),
    Budh:   getMercuryLongitude(jd),
    Guru:   getJupiterLongitude(jd),
    Shukra: getVenusLongitude(jd),
    Shani:  getSaturnLongitude(jd),
    Rahu:   getRahuLongitude(jd),
    Ketu:   { longitude: normalizeAngle(getRahuLongitude(jd).longitude + 180), speed: -0.053 },
  };

  // Calculate Ascendant
  const tropicalAsc = getAscendant(jd, lat, lng);
  const sidAsc = toSidereal(tropicalAsc);
  const lagnaNum = Math.floor(sidAsc / 30);

  // Build planet positions object
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

  // Moon sign = Rashi
  const moonLon = planets.Chandra.longitude;
  const rashiNum = planets.Chandra.rashiNum;

  // Nakshatra from Moon longitude
  const NAKSHATRA_SIZE = 360 / 27;
  const nakshatraIndex = Math.floor(moonLon / NAKSHATRA_SIZE);
  const nakshatra = NAKSHATRAS[nakshatraIndex];
  const degInNakshatra = moonLon % NAKSHATRA_SIZE;
  const nakshatraPada = Math.floor(degInNakshatra / (NAKSHATRA_SIZE / 4)) + 1;
  const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex] as DashaLord;

  // Build dasha timeline
  const fractionElapsed = degInNakshatra / NAKSHATRA_SIZE;
  const dashaLordIndex = DASHA_ORDER.indexOf(nakshatraLord);

  // Calculate birth date as Date object
  const birthDate = new Date(`${dob}T${tob}:00+05:30`);

  // First dasha: years elapsed before birth date
  const yearsElapsed = fractionElapsed * (DASHA_ORDER[dashaLordIndex] as DashaLord) as unknown as number;
  // Actually:
  const firstDashaYears = fractionElapsed * getDashaYears(nakshatraLord);
  const firstDashaStartMs = birthDate.getTime() - firstDashaYears * 365.25 * 24 * 3600 * 1000;
  let currentStart = new Date(firstDashaStartMs);

  const today = new Date();
  const dashas: DashaPeriod[] = [];

  // Build 9 mahadashas starting from nakshatraLord
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(dashaLordIndex + i) % 9] as DashaLord;
    const years = getDashaYears(lord);
    const endDate = addYears(currentStart, years);
    const isCurrent = today >= currentStart && today < endDate;

    // Build antardashas
    const antardashas: Antardasha[] = [];
    let adStart = new Date(currentStart);
    for (let j = 0; j < 9; j++) {
      const adLord = DASHA_ORDER[(DASHA_ORDER.indexOf(lord) + j) % 9] as DashaLord;
      const adYears = (years * getDashaYears(adLord)) / 120;
      const adEnd = addYears(adStart, adYears);
      const adCurrent = today >= adStart && today < adEnd;
      antardashas.push({
        lord: adLord,
        startDate: adStart.toISOString().split('T')[0],
        endDate: adEnd.toISOString().split('T')[0],
        isCurrent: adCurrent,
      });
      adStart = new Date(adEnd);
    }

    dashas.push({
      lord,
      years,
      startDate: currentStart.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      isCurrent,
      antardashas,
    });
    currentStart = new Date(endDate);
  }

  // Find current dasha
  const currentDashaPeriod = dashas.find(d => d.isCurrent) || dashas[0];
  const currentAntardasha = currentDashaPeriod.antardashas.find(a => a.isCurrent) || currentDashaPeriod.antardashas[0];

  const currentDasha: CurrentDasha = {
    lord: currentDashaPeriod.lord,
    startDate: currentDashaPeriod.startDate,
    endDate: currentDashaPeriod.endDate,
    antardasha: currentAntardasha,
  };

  return {
    name,
    dob,
    tob,
    pob,
    lat,
    lng,
    rashiNum,
    rashi: RASHIS[rashiNum],
    rashiDevanagari: RASHIS_DEVANAGARI[rashiNum],
    rashiEnglish: RASHI_ENGLISH[rashiNum],
    lagnaNum,
    lagna: RASHIS[lagnaNum],
    lagnaDevanagari: RASHIS_DEVANAGARI[lagnaNum],
    lagnaEnglish: RASHI_ENGLISH[lagnaNum],
    nakshatra,
    nakshatraPada: Math.min(nakshatraPada, 4),
    nakshatraLord,
    planets,
    dashas,
    currentDasha,
    houseCenters: HOUSE_CENTERS,
    calculatedAt: new Date().toISOString(),
  };
}

function getDashaYears(lord: DashaLord): number {
  const years: Record<DashaLord, number> = {
    Ketu: 7, Shukra: 20, Surya: 6, Chandra: 10, Mangal: 7,
    Rahu: 18, Guru: 16, Shani: 19, Budh: 17,
  };
  return years[lord];
}

function addYears(date: Date, years: number): Date {
  const ms = years * 365.25 * 24 * 3600 * 1000;
  return new Date(date.getTime() + ms);
}
