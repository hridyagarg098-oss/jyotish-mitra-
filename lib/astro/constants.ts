// ═══════════════════════════════════════════
// JYOTISH MITRA — ASTROLOGY CONSTANTS
// All Vedic astrology reference data
// ═══════════════════════════════════════════

export const RASHIS = [
  'Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Singh', 'Kanya',
  'Tula', 'Vrishchik', 'Dhanu', 'Makar', 'Kumbh', 'Meen',
] as const;

export const RASHIS_DEVANAGARI = [
  'मेष', 'वृष', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन',
] as const;

export const RASHI_SYMBOLS = [
  '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓',
] as const;

export const RASHI_ENGLISH = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const RASHI_ELEMENTS = [
  'Fire', 'Earth', 'Air', 'Water', 'Fire', 'Earth',
  'Air', 'Water', 'Fire', 'Earth', 'Air', 'Water',
] as const;

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
  'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
  'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
  'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

export const NAKSHATRA_LORDS = [
  'Ketu', 'Shukra', 'Surya', 'Chandra', 'Mangal', 'Rahu', 'Guru', 'Shani', 'Budh',
  'Ketu', 'Shukra', 'Surya', 'Chandra', 'Mangal', 'Rahu', 'Guru', 'Shani', 'Budh',
  'Ketu', 'Shukra', 'Surya', 'Chandra', 'Mangal', 'Rahu', 'Guru', 'Shani', 'Budh',
] as const;

export const DASHA_ORDER = [
  'Ketu', 'Shukra', 'Surya', 'Chandra', 'Mangal', 'Rahu', 'Guru', 'Shani', 'Budh',
] as const;

export type DashaLord = (typeof DASHA_ORDER)[number];

export const DASHA_YEARS: Record<DashaLord, number> = {
  Ketu: 7, Shukra: 20, Surya: 6, Chandra: 10, Mangal: 7,
  Rahu: 18, Guru: 16, Shani: 19, Budh: 17,
};

export const PLANETS = [
  'Surya', 'Chandra', 'Mangal', 'Budh', 'Guru', 'Shukra', 'Shani', 'Rahu', 'Ketu',
] as const;

export type PlanetName = (typeof PLANETS)[number];

export const PLANET_SYMBOLS: Record<PlanetName, string> = {
  Surya: '☉', Chandra: '☽', Mangal: '♂', Budh: '☿',
  Guru: '♃', Shukra: '♀', Shani: '♄', Rahu: '☊', Ketu: '☋',
};

export const PLANET_DEVANAGARI: Record<PlanetName, string> = {
  Surya: 'सूर्य', Chandra: 'चन्द्र', Mangal: 'मंगल', Budh: 'बुध',
  Guru: 'गुरु', Shukra: 'शुक्र', Shani: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

export const PLANET_ABBR_DEVANAGARI: Record<PlanetName, string> = {
  Surya: 'सू', Chandra: 'चं', Mangal: 'मं', Budh: 'बु',
  Guru: 'गु', Shukra: 'शु', Shani: 'श', Rahu: 'रा', Ketu: 'के',
};

export const PLANET_COLORS: Record<PlanetName, string> = {
  Surya: '#e67e22', Chandra: '#bdc3c7', Mangal: '#c0392b', Budh: '#27ae60',
  Guru: '#f39c12', Shukra: '#8e44ad', Shani: '#2980b9', Rahu: '#7f8c8d', Ketu: '#c0392b',
};

export const PLANET_ENGLISH: Record<PlanetName, string> = {
  Surya: 'Sun', Chandra: 'Moon', Mangal: 'Mars', Budh: 'Mercury',
  Guru: 'Jupiter', Shukra: 'Venus', Shani: 'Saturn', Rahu: 'Rahu (North Node)', Ketu: 'Ketu (South Node)',
};

// Rashi lord
export const RASHI_LORDS: Record<number, PlanetName> = {
  0: 'Mangal', 1: 'Shukra', 2: 'Budh', 3: 'Chandra', 4: 'Surya',
  5: 'Budh', 6: 'Shukra', 7: 'Mangal', 8: 'Guru', 9: 'Shani',
  10: 'Shani', 11: 'Guru',
};

// Exaltation: planet → rashiNum where it is exalted
export const EXALTATION: Partial<Record<PlanetName, number>> = {
  Surya: 0, Chandra: 1, Mangal: 9, Budh: 5, Guru: 3, Shukra: 11, Shani: 6,
};

// Debilitation: planet → rashiNum where it is debilitated
export const DEBILITATION: Partial<Record<PlanetName, number>> = {
  Surya: 6, Chandra: 7, Mangal: 3, Budh: 11, Guru: 9, Shukra: 5, Shani: 0,
};

// Own signs (Swakshetra)
export const OWN_SIGNS: Partial<Record<PlanetName, number[]>> = {
  Surya: [4], Chandra: [3], Mangal: [0, 7], Budh: [2, 5],
  Guru: [8, 11], Shukra: [1, 6], Shani: [9, 10],
};

// Nakshatra Gana
export const NAKSHATRA_GANA: Record<string, 'Deva' | 'Manushya' | 'Rakshasa'> = {
  Ashwini: 'Deva', Bharani: 'Manushya', Krittika: 'Rakshasa',
  Rohini: 'Manushya', Mrigashira: 'Deva', Ardra: 'Manushya',
  Punarvasu: 'Deva', Pushya: 'Deva', Ashlesha: 'Rakshasa',
  Magha: 'Rakshasa', 'Purva Phalguni': 'Manushya', 'Uttara Phalguni': 'Manushya',
  Hasta: 'Deva', Chitra: 'Rakshasa', Swati: 'Deva',
  Vishakha: 'Rakshasa', Anuradha: 'Deva', Jyeshtha: 'Rakshasa',
  Mula: 'Rakshasa', 'Purva Ashadha': 'Manushya', 'Uttara Ashadha': 'Manushya',
  Shravana: 'Deva', Dhanishtha: 'Rakshasa', Shatabhisha: 'Rakshasa',
  'Purva Bhadrapada': 'Manushya', 'Uttara Bhadrapada': 'Manushya', Revati: 'Deva',
};

// Nakshatra Nadi
export const NAKSHATRA_NADI: Record<string, 'Aadi' | 'Madhya' | 'Antya'> = {
  Ashwini: 'Aadi', Bharani: 'Madhya', Krittika: 'Antya',
  Rohini: 'Antya', Mrigashira: 'Madhya', Ardra: 'Aadi',
  Punarvasu: 'Aadi', Pushya: 'Madhya', Ashlesha: 'Antya',
  Magha: 'Antya', 'Purva Phalguni': 'Madhya', 'Uttara Phalguni': 'Aadi',
  Hasta: 'Aadi', Chitra: 'Madhya', Swati: 'Antya',
  Vishakha: 'Antya', Anuradha: 'Madhya', Jyeshtha: 'Aadi',
  Mula: 'Aadi', 'Purva Ashadha': 'Madhya', 'Uttara Ashadha': 'Antya',
  Shravana: 'Antya', Dhanishtha: 'Madhya', Shatabhisha: 'Aadi',
  'Purva Bhadrapada': 'Aadi', 'Uttara Bhadrapada': 'Madhya', Revati: 'Antya',
};

// Nakshatra Yoni (animal, gender)
export const NAKSHATRA_YONI: Record<string, [string, 'M' | 'F']> = {
  Ashwini: ['horse', 'M'], Bharani: ['elephant', 'M'],
  Krittika: ['goat', 'F'], Rohini: ['serpent', 'M'],
  Mrigashira: ['serpent', 'F'], Ardra: ['dog', 'F'],
  Punarvasu: ['cat', 'F'], Pushya: ['goat', 'M'],
  Ashlesha: ['cat', 'M'], Magha: ['rat', 'M'],
  'Purva Phalguni': ['rat', 'F'], 'Uttara Phalguni': ['cow', 'M'],
  Hasta: ['buffalo', 'M'], Chitra: ['tiger', 'F'],
  Swati: ['buffalo', 'F'], Vishakha: ['tiger', 'M'],
  Anuradha: ['deer', 'F'], Jyeshtha: ['deer', 'M'],
  Mula: ['dog', 'M'], 'Purva Ashadha': ['monkey', 'M'],
  'Uttara Ashadha': ['mongoose', 'M'], Shravana: ['monkey', 'F'],
  Dhanishtha: ['lion', 'M'], Shatabhisha: ['horse', 'F'],
  'Purva Bhadrapada': ['lion', 'F'], 'Uttara Bhadrapada': ['cow', 'F'],
  Revati: ['elephant', 'F'],
};

// Friendly animals for Yoni matching
export const YONI_FRIENDLY: Record<string, string[]> = {
  horse: ['horse'], elephant: ['elephant'],
  goat: ['goat', 'cow'], serpent: ['serpent'],
  dog: ['dog', 'cat'], cat: ['cat', 'rat'],
  rat: ['rat', 'cat'], cow: ['cow', 'goat', 'buffalo'],
  buffalo: ['buffalo', 'cow'], tiger: ['tiger', 'deer'],
  deer: ['deer', 'tiger'], monkey: ['monkey'],
  mongoose: ['mongoose'], lion: ['lion'],
};

export const YONI_ENEMY: Record<string, string> = {
  horse: 'buffalo', elephant: 'lion', goat: 'monkey',
  serpent: 'mongoose', dog: 'deer', cat: 'rat',
  rat: 'cat', cow: 'tiger', buffalo: 'horse',
  tiger: 'cow', deer: 'dog', monkey: 'goat',
  lion: 'elephant', mongoose: 'serpent',
};

// Planet friendship table
export const PLANET_FRIENDS: Record<PlanetName, PlanetName[]> = {
  Surya: ['Chandra', 'Mangal', 'Guru'],
  Chandra: ['Surya', 'Budh'],
  Mangal: ['Surya', 'Chandra', 'Guru'],
  Budh: ['Surya', 'Shukra'],
  Guru: ['Surya', 'Chandra', 'Mangal'],
  Shukra: ['Budh', 'Shani'],
  Shani: ['Budh', 'Shukra', 'Rahu', 'Ketu'],
  Rahu: ['Shani', 'Budh', 'Shukra'],
  Ketu: ['Shani', 'Budh', 'Shukra'],
};

export const PLANET_NEUTRAL: Record<PlanetName, PlanetName[]> = {
  Surya: ['Budh'],
  Chandra: ['Mangal', 'Guru', 'Shukra', 'Shani'],
  Mangal: ['Shani', 'Budh'],
  Budh: ['Mangal', 'Guru', 'Shani', 'Rahu', 'Ketu'],
  Guru: ['Shani', 'Budh'],
  Shukra: ['Mangal', 'Guru', 'Rahu', 'Ketu'],
  Shani: ['Guru'],
  Rahu: ['Mangal', 'Guru'],
  Ketu: ['Mangal', 'Guru'],
};

// Varna for Guna Milan
export const RASHI_VARNA: Record<number, 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra'> = {
  3: 'Brahmin', 7: 'Brahmin', 11: 'Brahmin',   // Kark, Vrishchik, Meen
  0: 'Kshatriya', 4: 'Kshatriya', 8: 'Kshatriya', // Mesh, Singh, Dhanu
  1: 'Vaishya', 5: 'Vaishya', 9: 'Vaishya',   // Vrishabh, Kanya, Makar
  2: 'Shudra', 6: 'Shudra', 10: 'Shudra',     // Mithun, Tula, Kumbh
};

export const VARNA_RANK: Record<string, number> = {
  Brahmin: 3, Kshatriya: 2, Vaishya: 1, Shudra: 0,
};

// Vashya groups
export const RASHI_VASHYA: Record<number, string> = {
  0: 'Chatushpad', 1: 'Chatushpad', 2: 'Manav', 3: 'Jalchar',
  4: 'Vanchar', 5: 'Manav', 6: 'Manav', 7: 'Keeta',
  8: 'Chatushpad', 9: 'Chatushpad', 10: 'Manav', 11: 'Jalchar',
};

// North Indian chart house center coords (340×340 viewBox)
export const HOUSE_CENTERS: Record<number, [number, number]> = {
  1:  [170, 47],   // Top center
  2:  [296, 47],   // Top right
  3:  [318, 170],  // Right center
  4:  [296, 296],  // Bottom right
  5:  [170, 318],  // Bottom center
  6:  [44,  296],  // Bottom left
  7:  [22,  170],  // Left center
  8:  [44,  47],   // Top left
  9:  [108,  85],  // Top left quadrant
  10: [232,  85],  // Top right quadrant
  11: [255, 130],  // Right upper
  12: [85,  130],  // Left upper
};

export type RashiName = (typeof RASHIS)[number];
export type NakshatraName = (typeof NAKSHATRAS)[number];
