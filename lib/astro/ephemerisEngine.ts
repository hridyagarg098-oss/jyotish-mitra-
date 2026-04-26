// ═══════════════════════════════════════════
// EPHEMERIS ENGINE — Full VSOP87 via astronomia
// SERVER-SIDE ONLY — never import in client
// Provides JPL-quality geocentric ecliptic longitudes
//
// astronomia API:
//   solar.apparentLongitude(T)        → radians  (T = Julian centuries from J2000)
//   moonposition.position(jde)        → { lon: radians }  (takes JDE directly)
//   planetposition.Planet.position(T) → { lon, lat, range: radians/AU } (T = Julian centuries)
// ═══════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-require-imports */
const { planetposition, solar, moonposition } = require('astronomia');
const rawData = require('astronomia/data');
const data = rawData.default ?? rawData;

// ── Planet instances (VSOP87B = ecliptic heliocentric) ──
const earthPlanet   = new planetposition.Planet(data.earth);
const marsPlanet    = new planetposition.Planet(data.mars);
const mercuryPlanet = new planetposition.Planet(data.mercury);
const jupiterPlanet = new planetposition.Planet(data.jupiter);
const venusPlanet   = new planetposition.Planet(data.venus);
const saturnPlanet  = new planetposition.Planet(data.saturn);

const DEG = 180 / Math.PI;
const J2000 = 2451545.0;

function norm360(d: number): number {
  return ((d % 360) + 360) % 360;
}

// Julian centuries from J2000 (what astronomia's Planet.position expects)
function jdeToT(jde: number): number {
  return (jde - J2000) / 36525.0;
}

// ──────────────────────────────────────────
// GEOCENTRIC ECLIPTIC LONGITUDE FROM VSOP87
// Heliocentric (planet) − heliocentric (Earth) → geocentric
// Meeus "Astronomical Algorithms" Ch.32
// ──────────────────────────────────────────
function helioToGeo(
  planet: typeof marsPlanet,
  T: number,
): { longitude: number; speed: number } {
  // Heliocentric positions in radians (VSOP87B: ecliptic heliocentric)
  const p = planet.position(T);
  const e = earthPlanet.position(T);

  // Rectangular heliocentric
  const xp = p.range * Math.cos(p.lat) * Math.cos(p.lon);
  const yp = p.range * Math.cos(p.lat) * Math.sin(p.lon);
  const xe = e.range * Math.cos(e.lat) * Math.cos(e.lon);
  const ye = e.range * Math.cos(e.lat) * Math.sin(e.lon);

  const lon = norm360(Math.atan2(yp - ye, xp - xe) * DEG);

  // Speed: compare with T + 1 day
  const T2 = T + 1 / 36525;
  const p2 = planet.position(T2);
  const e2 = earthPlanet.position(T2);
  const xp2 = p2.range * Math.cos(p2.lat) * Math.cos(p2.lon);
  const yp2 = p2.range * Math.cos(p2.lat) * Math.sin(p2.lon);
  const xe2 = e2.range * Math.cos(e2.lat) * Math.cos(e2.lon);
  const ye2 = e2.range * Math.cos(e2.lat) * Math.sin(e2.lon);
  const lon2 = norm360(Math.atan2(yp2 - ye2, xp2 - xe2) * DEG);

  let speed = lon2 - lon;
  if (speed > 180)  speed -= 360;
  if (speed < -180) speed += 360;

  return { longitude: lon, speed };
}

// ──────────────────────────────────────────
// SUN — solar.apparentLongitude(T) → radians
// ──────────────────────────────────────────
function getSun(T: number): { longitude: number; speed: number } {
  const lon  = norm360(solar.apparentLongitude(T) * DEG);
  const T2   = T + 1 / 36525;
  const lon2 = norm360(solar.apparentLongitude(T2) * DEG);
  let speed = lon2 - lon;
  if (speed > 180)  speed -= 360;
  if (speed < -180) speed += 360;
  return { longitude: lon, speed };
}

// ──────────────────────────────────────────
// MOON — moonposition.position(jde) → { lon: radians }
// moonposition takes JDE (not T)
// ──────────────────────────────────────────
function getMoon(jde: number): { longitude: number; speed: number } {
  const pos  = moonposition.position(jde);
  const lon  = norm360(pos.lon * DEG);
  const pos2 = moonposition.position(jde + 1);
  const lon2 = norm360(pos2.lon * DEG);
  let speed = lon2 - lon;
  if (speed > 180)  speed -= 360;
  if (speed < -180) speed += 360;
  return { longitude: lon, speed };
}

// ──────────────────────────────────────────
// RAHU — Moon's Mean North Node (always retrograde)
// Meeus Ch.22 — takes JDE
// ──────────────────────────────────────────
function getRahu(T: number): { longitude: number; speed: number } {
  // T here is Julian centuries from J2000
  const lon = norm360(
    125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000
  );
  return { longitude: lon, speed: -0.053 };
}

// ──────────────────────────────────────────
// PUBLIC API
// jde = Julian Day (Ephemeris Day, ≈ Julian Day for our precision)
// Returns tropical geocentric longitudes for all 9 Vedic grahas
// ──────────────────────────────────────────
export interface PlanetRaw {
  longitude: number;  // tropical geocentric degrees (0–360)
  speed: number;      // degrees/day (negative = retrograde)
}

export function getAllPlanetPositions(jde: number): Record<string, PlanetRaw> {
  const T = jdeToT(jde);

  const sun   = getSun(T);
  const moon  = getMoon(jde);      // moonposition takes JDE
  const mars  = helioToGeo(marsPlanet,    T);
  const merc  = helioToGeo(mercuryPlanet, T);
  const jup   = helioToGeo(jupiterPlanet, T);
  const ven   = helioToGeo(venusPlanet,   T);
  const sat   = helioToGeo(saturnPlanet,  T);
  const rahu  = getRahu(T);
  const ketu  = { longitude: norm360(rahu.longitude + 180), speed: -0.053 };

  return {
    Surya:   sun,
    Chandra: moon,
    Mangal:  mars,
    Budh:    merc,
    Guru:    jup,
    Shukra:  ven,
    Shani:   sat,
    Rahu:    rahu,
    Ketu:    ketu,
  };
}
