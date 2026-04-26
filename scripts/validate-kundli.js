// Plain Node.js validation — uses astronomia directly (no TS compile needed)
// Run: node scripts/validate-kundli.js

const { planetposition, solar, moonposition } = require('astronomia');
const rawData = require('astronomia/data');
const data = rawData.default ?? rawData;

// Planet instances
const earthPlanet   = new planetposition.Planet(data.earth);
const marsPlanet    = new planetposition.Planet(data.mars);
const mercuryPlanet = new planetposition.Planet(data.mercury);
const jupiterPlanet = new planetposition.Planet(data.jupiter);
const venusPlanet   = new planetposition.Planet(data.venus);
const saturnPlanet  = new planetposition.Planet(data.saturn);

const DEG = 180 / Math.PI;
function norm(d) { return ((d % 360) + 360) % 360; }

// astronomia API:
//   solar.apparentLongitude(T)        → radians  (T = Julian centuries from J2000)
//   moonposition.position(jde)        → { lon: radians }  (JDE directly)
//   planetposition.Planet.position(T) → heliocentric (T = Julian centuries)

function jdeToT(jde) { return (jde - 2451545.0) / 36525.0; }

function helioToGeo(planet, T) {
  const p = planet.position(T);
  const e = earthPlanet.position(T);
  const xp = p.range * Math.cos(p.lat) * Math.cos(p.lon);
  const yp = p.range * Math.cos(p.lat) * Math.sin(p.lon);
  const xe = e.range * Math.cos(e.lat) * Math.cos(e.lon);
  const ye = e.range * Math.cos(e.lat) * Math.sin(e.lon);
  const lon = norm(Math.atan2(yp - ye, xp - xe) * DEG);
  const T2 = T + 1/36525;
  const p2 = planet.position(T2), e2 = earthPlanet.position(T2);
  const xp2 = p2.range*Math.cos(p2.lat)*Math.cos(p2.lon), yp2 = p2.range*Math.cos(p2.lat)*Math.sin(p2.lon);
  const xe2 = e2.range*Math.cos(e2.lat)*Math.cos(e2.lon), ye2 = e2.range*Math.cos(e2.lat)*Math.sin(e2.lon);
  const lon2 = norm(Math.atan2(yp2-ye2, xp2-xe2)*DEG);
  let speed = lon2 - lon; if (speed > 180) speed -= 360; if (speed < -180) speed += 360;
  return { longitude: lon, speed };
}

function getSun(T) {
  const lon = norm(solar.apparentLongitude(T) * DEG);
  const lon2 = norm(solar.apparentLongitude(T + 1/36525)*DEG);
  let speed = lon2-lon; if(speed>180)speed-=360; if(speed<-180)speed+=360;
  return { longitude: lon, speed };
}
function getMoon(jde) {  // moonposition takes JDE directly
  const pos = moonposition.position(jde);
  const lon = norm(pos.lon * DEG);
  const pos2 = moonposition.position(jde+1);
  const lon2 = norm(pos2.lon*DEG);
  let speed = lon2-lon; if(speed>180)speed-=360; if(speed<-180)speed+=360;
  return { longitude: lon, speed };
}
function getRahu(T) {
  const lon = norm(125.04452 - 1934.136261*T + 0.0020708*T*T + T*T*T/450000);
  return { longitude: lon, speed: -0.053 };
}
function getAllPlanets(jde) {
  const T = jdeToT(jde);
  const rahu = getRahu(T);
  return {
    Surya:   getSun(T),
    Chandra: getMoon(jde),
    Mangal:  helioToGeo(marsPlanet, T),
    Budh:    helioToGeo(mercuryPlanet, T),
    Guru:    helioToGeo(jupiterPlanet, T),
    Shukra:  helioToGeo(venusPlanet, T),
    Shani:   helioToGeo(saturnPlanet, T),
    Rahu:    rahu,
    Ketu:    { longitude: norm(rahu.longitude + 180), speed: -0.053 },
  };
}

function getLahiriAyanamsa(jd) {
  const T = (jd - 2415020.0) / 36525.0;
  return 22.4600417 + (50.2388475 / 3600) * T * 100;
}
function dateToJD(y, mo, d, h) {
  let year = y, month = mo;
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25*(year+4716)) + Math.floor(30.6001*(month+1)) + d + h/24 + B - 1524.5;
}
function getAscendant(jd, lat, lng) {
  const T = (jd - 2451545.0) / 36525.0;
  const GMST = norm(280.46061837 + 360.98564736629*(jd-2451545) + 0.000387933*T*T);
  const RAMC = norm(GMST + lng);
  const RAmcRad = RAMC * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const obliquity = 23.4392911 - 0.013004167*T;
  const epsRad = obliquity * Math.PI / 180;
  const Y = -Math.cos(RAmcRad);
  const X = Math.sin(RAmcRad)*Math.cos(epsRad) + Math.tan(latRad)*Math.sin(epsRad);
  let asc = Math.atan2(Y, X) * 180 / Math.PI;
  if (asc < 0) asc += 360;
  // Quadrant correction (Meeus Ch.14): add 180 when denominator X < 0
  if (X < 0) asc = norm(asc + 180);
  return asc;
}

const RASHIS = ['Mesh','Vrishabh','Mithun','Kark','Singh','Kanya','Tula','Vrishchik','Dhanu','Makar','Kumbh','Meen'];
const NAKS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];

function runChart(label, y, mo, d, timeIST, lat, lng, refs) {
  console.log('\n\x1b[1m' + '═'.repeat(60) + '\x1b[0m');
  console.log('\x1b[1m' + label + '\x1b[0m');
  console.log('═'.repeat(60));

  const [h, mi] = timeIST.split(':').map(Number);
  let hourUT = (h + mi/60) - 5.5;
  let day = d, month = mo, year = y;
  if (hourUT < 0) {
    hourUT += 24; day--;
    if (day < 1) { month--; if (month<1){month=12;year--;} day=new Date(year,month,0).getDate(); }
  }
  const jd = dateToJD(year, month, day, hourUT);
  const ayanamsa = getLahiriAyanamsa(jd);

  console.log(`  JD: ${jd.toFixed(2)}  |  Ayanamsa: ${ayanamsa.toFixed(4)}°`);

  const raw = getAllPlanets(jd);
  const tropAsc = getAscendant(jd, lat, lng);
  const sidAsc = norm(tropAsc - ayanamsa);
  const lagnaNum = Math.floor(sidAsc / 30);

  const lagnaOk = lagnaNum === refs.lagnaNum;
  console.log(`  Lagna: ${lagnaOk ? '\x1b[32m✓' : '\x1b[31m✗'} ${RASHIS[lagnaNum]} (${lagnaNum})  expected: ${refs.lagnaLabel}\x1b[0m`);

  console.log('\n  Planet Positions (Sidereal Lahiri):');
  console.log('  ' + 'Planet'.padEnd(10) + 'Rashi'.padEnd(12) + 'Deg in Rashi'.padEnd(14) + 'Nakshatra'.padEnd(20) + 'Retro');
  console.log('  ' + '-'.repeat(62));
  for (const [p, pos] of Object.entries(raw)) {
    const sid = norm(pos.longitude - ayanamsa);
    const rNum = Math.floor(sid / 30);
    const deg = (sid % 30).toFixed(3);
    const nak = NAKS[Math.floor(sid / (360/27))];
    const retro = pos.speed < 0 ? 'R' : '';
    console.log('  ' + p.padEnd(10) + RASHIS[rNum].padEnd(12) + deg.padEnd(14) + nak.padEnd(20) + retro);
  }

  if (refs.moonNak) {
    const moonSid = norm(raw.Chandra.longitude - ayanamsa);
    const moonNak = NAKS[Math.floor(moonSid / (360/27))];
    const nakOk = moonNak === refs.moonNak;
    console.log(`\n  Moon Nakshatra: ${nakOk ? '\x1b[32m✓' : '\x1b[31m✗'} ${moonNak}  (expected: ${refs.moonNak})\x1b[0m`);
  }
}

// ─── APJ Abdul Kalam ───
runChart(
  'APJ Abdul Kalam — 15 Oct 1931, 13:00 IST, Rameswaram (9.29°N, 79.31°E)',
  1931, 10, 15, '13:00', 9.2876, 79.3129,
  { lagnaNum: 9, lagnaLabel: 'Makar/Capricorn (9)', moonNak: 'Jyeshtha' }
);

// ─── Narendra Modi ───
runChart(
  'Narendra Modi — 17 Sep 1950, 10:00 IST, Vadnagar (23.79°N, 72.64°E)',
  1950, 9, 17, '10:00', 23.7869, 72.6394,
  { lagnaNum: 7, lagnaLabel: 'Vrishchik/Scorpio (7)' }
);

// ─── Ayanamsa spot-check ───
console.log('\n\x1b[1m═══ Ayanamsa at J2000.0 ═══\x1b[0m');
const a2000 = getLahiriAyanamsa(2451545.0);
const ref = 23.8531;
const diff = Math.abs(a2000 - ref);
console.log(`  Our value: ${a2000.toFixed(4)}°`);
console.log(`  Reference (Jagannatha Hora): ${ref}°`);
console.log(`  Difference: ${diff.toFixed(4)}° (${(diff*60).toFixed(2)} arc-minutes)`);
console.log(`  ${diff < 0.05 ? '\x1b[32m✓ Within 3 arc-minutes\x1b[0m' : '\x1b[31m✗ Too far\x1b[0m'}`);
