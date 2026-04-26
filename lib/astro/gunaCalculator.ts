// ═══════════════════════════════════════════
// ASHTAKOOT GUNA MILAN CALCULATOR
// 8 categories, 36 total points
// ═══════════════════════════════════════════

import {
  RASHIS, NAKSHATRAS, NAKSHATRA_LORDS,
  RASHI_VARNA, VARNA_RANK, RASHI_VASHYA,
  NAKSHATRA_GANA, NAKSHATRA_NADI, NAKSHATRA_YONI,
  YONI_FRIENDLY, YONI_ENEMY,
  RASHI_LORDS, PLANET_FRIENDS, PLANET_NEUTRAL,
  type PlanetName, type DashaLord,
} from './constants';

export interface GunaScore {
  score: number;
  max: number;
  description: string;
}

export interface GunaBreakdown {
  varna:       GunaScore;
  vashya:      GunaScore;
  tara:        GunaScore;
  yoni:        GunaScore;
  grahaMaitri: GunaScore;
  gana:        GunaScore;
  bhakoot:     GunaScore;
  nadi:        GunaScore;
  nadiDosha:   boolean;
  manglikDosha?: boolean;
}

export interface MilanResult {
  totalGunas: number;
  gunaBreakdown: GunaBreakdown;
  verdict: 'Shreshtha' | 'Uttam' | 'Theek Hai' | 'Anushansit Nahin';
  verdictHinglish: string;
  verdictColor: string;
}

interface PersonAstro {
  rashiNum: number;
  nakshatraIndex: number;
  nakshatra: string;
}

function getNakshatraIndex(moonLongitude: number): number {
  return Math.floor(moonLongitude / (360 / 27));
}

// ─────────────────────────────────────────
// 1. VARNA (1 point)
// ─────────────────────────────────────────
function calcVarna(boy: PersonAstro, girl: PersonAstro): GunaScore {
  const boyVarna = RASHI_VARNA[boy.rashiNum];
  const girlVarna = RASHI_VARNA[girl.rashiNum];
  const boyRank = VARNA_RANK[boyVarna];
  const girlRank = VARNA_RANK[girlVarna];
  const score = boyRank >= girlRank ? 1 : 0;
  return {
    score, max: 1,
    description: score === 1
      ? `${boyVarna} + ${girlVarna} — Anukool (Compatible)`
      : `${boyVarna} + ${girlVarna} — Pratikool (Incompatible)`,
  };
}

// ─────────────────────────────────────────
// 2. VASHYA (2 points)
// ─────────────────────────────────────────
function calcVashya(boy: PersonAstro, girl: PersonAstro): GunaScore {
  const boyV = RASHI_VASHYA[boy.rashiNum];
  const girlV = RASHI_VASHYA[girl.rashiNum];
  
  // Mutual vashya pairs
  const mutualPairs: [string, string][] = [
    ['Manav', 'Manav'], ['Vanchar', 'Chatushpad'],
    ['Jalchar', 'Jalchar'], ['Chatushpad', 'Chatushpad'],
  ];
  
  const isMutual = mutualPairs.some(([a, b]) =>
    (boyV === a && girlV === b) || (boyV === b && girlV === a)
  );
  
  let score = 0;
  if (boyV === girlV) score = 2;
  else if (isMutual) score = 1;
  
  return {
    score, max: 2,
    description: `${boyV} + ${girlV} — ${score === 2 ? 'Uttam' : score === 1 ? 'Madhyam' : 'Pratikool'}`,
  };
}

// ─────────────────────────────────────────
// 3. TARA (3 points)
// ─────────────────────────────────────────
const TARA_NAMES = ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyak', 'Sadhana', 'Naidhana', 'Mitra', 'Paramamitra'];
const TARA_GOOD = [2, 4, 6, 8, 9]; // 1-indexed

function getTaraScore(from: number, to: number): number {
  const diff = ((to - from + 27) % 27) + 1;
  const taraNum = ((diff - 1) % 9) + 1;
  if (TARA_GOOD.includes(taraNum)) return 3;
  if (taraNum === 7) return 0; // Naidhana — bad
  return 1.5;
}

function calcTara(boy: PersonAstro, girl: PersonAstro): GunaScore {
  const boyToGirl = getTaraScore(boy.nakshatraIndex, girl.nakshatraIndex);
  const girlToBoy = getTaraScore(girl.nakshatraIndex, boy.nakshatraIndex);
  const score = Math.round((boyToGirl + girlToBoy) / 2 * 10) / 10;
  return {
    score: Math.min(score, 3), max: 3,
    description: `${boy.nakshatra} + ${girl.nakshatra} — Tara Milan: ${score}/3`,
  };
}

// ─────────────────────────────────────────
// 4. YONI (4 points)
// ─────────────────────────────────────────
function calcYoni(boy: PersonAstro, girl: PersonAstro): GunaScore {
  const boyYoni = NAKSHATRA_YONI[boy.nakshatra];
  const girlYoni = NAKSHATRA_YONI[girl.nakshatra];
  
  if (!boyYoni || !girlYoni) return { score: 2, max: 4, description: 'Yoni data unavailable' };
  
  const [boyAnimal, boyGender] = boyYoni;
  const [girlAnimal, girlGender] = girlYoni;
  
  let score = 0;
  if (boyAnimal === girlAnimal) {
    score = 4; // Same animal
  } else if (YONI_FRIENDLY[boyAnimal]?.includes(girlAnimal)) {
    score = 3;
  } else if (YONI_ENEMY[boyAnimal] === girlAnimal && boyGender !== girlGender) {
    score = 1;
  } else if (YONI_ENEMY[boyAnimal] === girlAnimal && boyGender === girlGender) {
    score = 0; // Same sex enemies — worst
  } else {
    score = 2; // Neutral
  }
  
  return {
    score, max: 4,
    description: `${boyAnimal}(${boyGender}) + ${girlAnimal}(${girlGender}) — ${['Kathor', 'Shatru', 'Saamaanya', 'Mitra', 'Uttam'][score]}`,
  };
}

// ─────────────────────────────────────────
// 5. GRAHA MAITRI (5 points)
// ─────────────────────────────────────────
function getRelation(lord: PlanetName, other: PlanetName): 'friend' | 'neutral' | 'enemy' {
  if (PLANET_FRIENDS[lord]?.includes(other)) return 'friend';
  if (PLANET_NEUTRAL[lord]?.includes(other)) return 'neutral';
  return 'enemy';
}

function calcGrahaMaitri(boy: PersonAstro, girl: PersonAstro): GunaScore {
  const boyLord = RASHI_LORDS[boy.rashiNum];
  const girlLord = RASHI_LORDS[girl.rashiNum];
  
  const boyToGirl = getRelation(boyLord, girlLord);
  const girlToBoy = getRelation(girlLord, boyLord);
  
  let score = 0;
  if (boyToGirl === 'friend' && girlToBoy === 'friend') score = 5;
  else if (boyToGirl === 'friend' && girlToBoy === 'neutral') score = 4;
  else if (boyToGirl === 'neutral' && girlToBoy === 'friend') score = 4;
  else if (boyToGirl === 'neutral' && girlToBoy === 'neutral') score = 3;
  else if (boyToGirl === 'friend' && girlToBoy === 'enemy') score = 1;
  else if (boyToGirl === 'enemy' && girlToBoy === 'friend') score = 1;
  else score = 0;
  
  return {
    score, max: 5,
    description: `${boyLord}→${girlLord}: ${boyToGirl}, ${girlLord}→${boyLord}: ${girlToBoy}`,
  };
}

// ─────────────────────────────────────────
// 6. GANA (6 points)
// ─────────────────────────────────────────
function calcGana(boy: PersonAstro, girl: PersonAstro): GunaScore {
  const boyGana = NAKSHATRA_GANA[boy.nakshatra];
  const girlGana = NAKSHATRA_GANA[girl.nakshatra];
  
  let score = 0;
  if (boyGana === girlGana) {
    score = 6;                                            // same gana = full marks
  } else if (boyGana === 'Deva' && girlGana === 'Manushya') {
    score = 5;                                            // Deva boy + Manushya girl = shubh
  } else if (boyGana === 'Manushya' && girlGana === 'Deva') {
    score = 5;                                            // ← BUG FIX: was incorrectly 6
  } else if (boyGana === 'Deva' && girlGana === 'Rakshasa') {
    score = 1;                                            // Dev+Raksha = 1, not 0 (BPHS)
  } else if (boyGana === 'Rakshasa' && girlGana === 'Deva') {
    score = 0;                                            // Rakshasa boy + Deva girl = 0
  } else if (boyGana === 'Manushya' && girlGana === 'Rakshasa') {
    score = 0;
  } else if (boyGana === 'Rakshasa' && girlGana === 'Manushya') {
    score = 0;
  }
  
  return {
    score, max: 6,
    description: score === 6
      ? `${boyGana} + ${girlGana} — Uttam (Same gana)`
      : score >= 5
      ? `${boyGana} + ${girlGana} — Achha (Mitra gana)`
      : score >= 1
      ? `${boyGana} + ${girlGana} — Saamaanya — upay se theek hoga`
      : `${boyGana} + ${girlGana} — Gana Dosha — swabhaav mein antar, dhyan do`,
  };
}

// ─────────────────────────────────────────
// 7. BHAKOOT (7 points)
// ─────────────────────────────────────────
function calcBhakoot(boy: PersonAstro, girl: PersonAstro): GunaScore {
  const boyToGirl = ((girl.rashiNum - boy.rashiNum + 12) % 12) + 1;
  const girlToBoy = ((boy.rashiNum - girl.rashiNum + 12) % 12) + 1;
  
  // Inauspicious combinations: 6/8, 9/5, 12/2
  const inauspicious = [
    [6, 8], [8, 6], [9, 5], [5, 9], [12, 2], [2, 12],
  ];
  
  const isInauspicious = inauspicious.some(
    ([a, b]) => boyToGirl === a && girlToBoy === b
  );
  
  const score = isInauspicious ? 0 : 7;
  
  return {
    score, max: 7,
    description: `Rashi distance: ${boyToGirl}/${girlToBoy} — ${score === 7 ? 'Anukool' : 'Bhakoot Dosha present'}`,
  };
}

// ─────────────────────────────────────────
// 8. NADI (8 points) — Most important!
// ─────────────────────────────────────────
function calcNadi(boy: PersonAstro, girl: PersonAstro): { gunaScore: GunaScore; nadiDosha: boolean } {
  const boyNadi = NAKSHATRA_NADI[boy.nakshatra];
  const girlNadi = NAKSHATRA_NADI[girl.nakshatra];
  const nadiDosha = boyNadi === girlNadi;
  
  return {
    gunaScore: {
      score: nadiDosha ? 0 : 8,
      max: 8,
      description: `${boyNadi} + ${girlNadi} — ${nadiDosha ? '⚠️ Nadi Dosha! (Same nadi)' : 'Uttam (Different nadi)'}`,
    },
    nadiDosha,
  };
}

// ─────────────────────────────────────────
// MAIN GUNA MILAN FUNCTION
// ─────────────────────────────────────────
export function calculateGunaMilan(
  boyMoonLon: number,
  boyRashiNum: number,
  girlMoonLon: number,
  girlRashiNum: number,
): MilanResult {
  const boyNakIdx = getNakshatraIndex(boyMoonLon);
  const girlNakIdx = getNakshatraIndex(girlMoonLon);

  const boy: PersonAstro = {
    rashiNum: boyRashiNum,
    nakshatraIndex: boyNakIdx,
    nakshatra: NAKSHATRAS[boyNakIdx],
  };
  const girl: PersonAstro = {
    rashiNum: girlRashiNum,
    nakshatraIndex: girlNakIdx,
    nakshatra: NAKSHATRAS[girlNakIdx],
  };

  const varna       = calcVarna(boy, girl);
  const vashya      = calcVashya(boy, girl);
  const tara        = calcTara(boy, girl);
  const yoni        = calcYoni(boy, girl);
  const grahaMaitri = calcGrahaMaitri(boy, girl);
  const gana        = calcGana(boy, girl);
  const bhakoot     = calcBhakoot(boy, girl);
  const { gunaScore: nadi, nadiDosha } = calcNadi(boy, girl);

  const totalGunas = Math.round(
    varna.score + vashya.score + tara.score + yoni.score +
    grahaMaitri.score + gana.score + bhakoot.score + nadi.score
  );

  let verdict: MilanResult['verdict'];
  let verdictHinglish: string;
  let verdictColor: string;

  if (totalGunas >= 28) {
    verdict = 'Shreshtha';
    verdictHinglish = 'Ati uttam milan — yeh jodi ek doosre ke liye bani hai 🌟';
    verdictColor = '#27ae60';
  } else if (totalGunas >= 24) {
    verdict = 'Uttam';
    verdictHinglish = 'Bahut achha milan — vivah shubh rahega ✨';
    verdictColor = '#2ecc71';
  } else if (totalGunas >= 18) {
    verdict = 'Theek Hai';
    verdictHinglish = 'Madhyam milan — samjhauta zaroori, par vivah chal sakta hai 🟡';
    verdictColor = '#f39c12';
  } else {
    verdict = 'Anushansit Nahin';
    verdictHinglish = 'Milan theek nahi — dosha bahut hain, pandit se salah lein ⚠️';
    verdictColor = '#c0392b';
  }

  return {
    totalGunas,
    gunaBreakdown: {
      varna, vashya, tara, yoni, grahaMaitri, gana, bhakoot, nadi, nadiDosha,
    },
    verdict,
    verdictHinglish,
    verdictColor,
  };
}
