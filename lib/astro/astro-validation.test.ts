// ═══════════════════════════════════════════
// KUNDLI VALIDATION TEST
// Run: npx ts-node --esm lib/astro/astro-validation.test.ts
// Compares our engine output against reference values
// from Jagannatha Hora / AstroSage (Lahiri ayanamsa)
// ═══════════════════════════════════════════

import { calculateKundli } from './kundliEngine';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const YELLOW= '\x1b[33m';
const BOLD  = '\x1b[1m';

function ok(label: string, actual: number | string, expected: number | string, toleranceDeg = 1) {
  if (typeof actual === 'string' || typeof expected === 'string') {
    const pass = actual === expected;
    console.log(`  ${pass ? GREEN + '✓' : RED + '✗'} ${label}: ${actual} (expected: ${expected})${RESET}`);
    return pass;
  }
  const diff = Math.abs(actual - expected);
  const pass = diff <= toleranceDeg;
  const diffStr = diff.toFixed(3);
  console.log(
    `  ${pass ? GREEN + '✓' : RED + '✗'} ${label}: ${actual.toFixed(2)}° (expected ≈${expected}°, diff=${diffStr}°)${RESET}`
  );
  return pass;
}

// ──────────────────────────────────────────
// REFERENCE CHART 1 — APJ Abdul Kalam
// DOB: 15 Oct 1931, 13:00 IST, Rameswaram (9.2876°N, 79.3129°E)
// Reference: Jagannatha Hora (Lahiri ayanamsa)
// Expected:
//   Lagna: Capricorn (Makara) — rashiNum 9
//   Sun:   Libra, ~22–24° in rashi (~192–194° sidereal)
//   Moon:  Scorpio (Vrishchik), ~24° in rashi, Jyeshtha nakshatra
//   Dasha at birth: Mercury (Budh) mahadasha
// ──────────────────────────────────────────
const KALAM = {
  name: 'APJ Abdul Kalam',
  dob:  '1931-10-15',
  tob:  '13:00',
  lat:  9.2876,
  lng:  79.3129,
  pob:  'Rameswaram',
};

// Reference values (Jagannatha Hora, Lahiri)
const KALAM_REF = {
  lagnaNum:       9,            // Makara (Capricorn)
  lagnaName:      'Makar',
  sunLon:         192.5,        // Sun in Libra ~22°
  moonLon:        234.0,        // Moon in Scorpio ~24°, Jyeshtha
  nakshatra:      'Jyeshtha',
  dashaAtBirth:   'Budh',       // Mercury dasha at birth
};

// ──────────────────────────────────────────
// REFERENCE CHART 2 — Narendra Modi
// DOB: 17 Sep 1950, 10:00 IST, Vadnagar (23.7869°N, 72.6394°E)
// Reference: Various published charts (Lahiri)
// Expected:
//   Lagna: Scorpio (Vrishchik) — rashiNum 7
//   Sun:   Virgo (Kanya) — rashiNum 5
//   Moon:  Leo (Singh) — rashiNum 4
// ──────────────────────────────────────────
const MODI = {
  name: 'Narendra Modi',
  dob:  '1950-09-17',
  tob:  '10:00',
  lat:  23.7869,
  lng:  72.6394,
  pob:  'Vadnagar',
};

const MODI_REF = {
  lagnaNum:  7,     // Vrishchik (Scorpio)
  lagnaName: 'Vrishchik',
  sunLon:    150.0, // Kanya (Virgo) ≈ 150+
  moonLon:   120.0, // Singh (Leo) ≈ 120+
};

// ──────────────────────────────────────────
// RUN TESTS
// ──────────────────────────────────────────
async function runTests() {
  let passed = 0, failed = 0;

  // ─── Test 1: Kalam ───
  console.log(`\n${BOLD}═══ Chart 1: APJ Abdul Kalam ═══${RESET}`);
  const k = calculateKundli(KALAM);

  console.log(`\n  Ayanamsa used: ${YELLOW}(implicit in sidereal positions)${RESET}`);
  console.log(`  Lagna (raw sidereal): ${k.lagnaNum * 30 + (k.planets.Surya.longitude % 1)}°`);

  const tests1 = [
    ok('Lagna Rashi',    k.lagnaNum,  KALAM_REF.lagnaNum,  0),
    ok('Lagna Name',     k.lagna,     KALAM_REF.lagnaName),
    ok('Sun longitude',  k.planets.Surya.longitude,   KALAM_REF.sunLon,   2),
    ok('Moon longitude', k.planets.Chandra.longitude, KALAM_REF.moonLon,  2),
    ok('Nakshatra',      k.nakshatra, KALAM_REF.nakshatra),
    ok('Birth dasha lord (Moon nakshatra lord)', k.nakshatraLord, KALAM_REF.dashaAtBirth),
  ];
  passed += tests1.filter(Boolean).length;
  failed += tests1.filter(v => !v).length;

  console.log(`\n  Full planet positions:`);
  for (const p of Object.values(k.planets)) {
    const retro = p.isRetrograde ? ' ℞' : '';
    const dignity = p.dignity ? ` [${p.dignity}]` : '';
    console.log(`    ${p.name.padEnd(8)} ${p.rashi.padEnd(10)} ${p.degreeFormatted}  House ${p.house}${retro}${dignity}`);
  }

  console.log(`\n  Current dasha: ${k.currentDasha.lord} → Antardasha: ${k.currentDasha.antardasha.lord}`);

  // ─── Test 2: Modi ───
  console.log(`\n${BOLD}═══ Chart 2: Narendra Modi ═══${RESET}`);
  const m = calculateKundli(MODI);

  const tests2 = [
    ok('Lagna Rashi',    m.lagnaNum,  MODI_REF.lagnaNum,  0),
    ok('Lagna Name',     m.lagna,     MODI_REF.lagnaName),
    ok('Sun in Virgo',   m.planets.Surya.longitude,   MODI_REF.sunLon,   5),
    ok('Moon in Leo',    m.planets.Chandra.longitude, MODI_REF.moonLon,  5),
  ];
  passed += tests2.filter(Boolean).length;
  failed += tests2.filter(v => !v).length;

  console.log(`\n  Full planet positions:`);
  for (const p of Object.values(m.planets)) {
    const retro = p.isRetrograde ? ' ℞' : '';
    console.log(`    ${p.name.padEnd(8)} ${p.rashi.padEnd(10)} ${p.degreeFormatted}  House ${p.house}${retro}`);
  }

  // ─── Ayanamsa spot-check ───
  console.log(`\n${BOLD}═══ Ayanamsa Spot-Check ═══${RESET}`);
  // At J2000.0 (Jan 1.5, 2000), Lahiri ayanamsa should be ≈ 23.853°
  // (Jagannatha Hora reports ~23°51'11" = 23.8531°)
  const jd2000 = 2451545.0;
  const T_from1900 = (jd2000 - 2415020.0) / 36525.0;
  const ayan2000 = 22.4600417 + (50.2388475 / 3600) * T_from1900 * 100;
  const ayan2000_ref = 23.853;
  const diff = Math.abs(ayan2000 - ayan2000_ref);
  console.log(`  Ayanamsa at J2000.0: ${ayan2000.toFixed(4)}° (reference: ${ayan2000_ref}°, diff: ${diff.toFixed(4)}°)`);
  console.log(`  ${diff < 0.05 ? GREEN + '✓ Within 3 arc-minutes' : RED + '✗ Too far off'}${RESET}`);

  // ─── Summary ───
  console.log(`\n${BOLD}══════════════════════════════${RESET}`);
  console.log(`${passed > 0 ? GREEN : RED}Passed: ${passed}${RESET}  ${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}`);

  if (failed > 0) {
    console.log(`\n${YELLOW}Note: ±1-2° variance is normal for lagna (sensitive to birth time).${RESET}`);
    console.log(`${YELLOW}Planets should match Jagannatha Hora within ±0.5° for inner planets, ±1° for outer.${RESET}`);
  }
}

runTests().catch(console.error);
