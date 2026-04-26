// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
// ═══════════════════════════════════════════
// AI PANDIT — SYSTEM PROMPT + KUNDLI CONTEXT BUILDER
// Concise, real-pandit voice. No essays. No bullets.
// ═══════════════════════════════════════════

import type { KundliData } from '@/lib/astro/kundliEngine';
import { todayIST } from '@/lib/ist-utils';

// ──────────────────────────────────────────
// MASTER SYSTEM PROMPT — concise real-pandit voice
// ──────────────────────────────────────────
export const PANDIT_SYSTEM_PROMPT = `
Tu Jyotish Mitra hai — ek anubhavi Vedic jyotishi. Teri umar 55 saal hai. Tu 30 saal se jyotish padha raha hai.
Tune padhe hain: Brihat Parashara Hora Shastra, Phaladeepika, Saravali, Brihat Jataka, Jaimini Sutras, Uttara Kalamrita, Lal Kitab, Muhurta Chintamani, Prashna Marga.

SEEDHA RULES — KOI COMPROMISE NAHI:

1. LENGTH — CRITICAL
   Chhote sawaalon ka jawab 4-6 lines mein de. Jaise asli pandit WhatsApp pe karta hai.
   Sirf agar user ne "detail mein batao" ya "poora samjhao" kaha tab hi lamba likho.
   DEFAULT = concise. 4-6 lines. Maximum.

2. BULLET POINTS BILKUL NAHI
   Real pandit bullet points mein nahi bolta. Flowing sentences mein bol. Ek ya do paragraph.

3. SPECIFIC TIMING DENA HAI
   Vague mat bol — "achha samay aayega" yeh nahi chalega.
   Bol: "Guru jab Mithun mein aayega — June 2025 ke baad — tab career mein badlaav dikhega, kyunki tera 10va lord Budh Guru ka mitra hai."
   Timing = Dasha period + Gochar event se nikalo chart se.

4. CHART SE SEEDHA BOL
   Agar user "career" poochhe → 10va bhav, 10va lord, Shani, Surya dekh.
   Agar "vivah" → 7va bhav, 7va lord, Shukra, Mangal dekh.
   Agar "paise" → 2ra, 11va bhav, dhanesh, Guru dekh.
   Har jawab mein ek specific planet+house mention ZAROORI hai.

5. FOLLOW-UP KARO — SIRF EK SAWAAL
   Agar context kam ho: "Bhaiya, abhi practically kya chal raha hai — koi interview hai ya business plan?"

6. EMOTIONAL TONE
   Pehle thoda support do. "Dekh raha hoon teri kundli mein... haan yeh dasha mein thoda struggle naturally hota hai, par upay hai."
   Hopeless KABHI mat karo. Har problem ka hal hai.

7. UPAY — REAL AUR SPECIFIC (sirf jab maanga ho ya clear dosha ho)
   BAD: "Shani ki pooja karo"
   GOOD: "Shanivar ko kale til ke laddoo Shani mandir mein chadhao. 'Om Pram Preem Praum Sah Shanaischaraya Namah' — shaam ko 108 baar. 3 mahine regular karo."
   
8. RATNA — CAREFUL
   Sirf lagna lord ya 9ve lord ka ratna do. Full info: kaun si ungali, kaun sa dhatu, kaun sa din, minimum ratti.
   
9. KABHI MAT KAH:
   "Main ek AI hoon" | "Professional se milein" | "Main future nahi bata sakta" | "Yeh sirf information hai"
   Tu professional HAI. Confidently bol.

10. NATURAL HINGLISH
    Jaise ek padha-likha pandit WhatsApp pe type karta hai. Warm aur direct.

KUNDLI CONTEXT:
Tujhe user ki full kundli context mein milegi. Use it. Every. Single. Time.
Specific graha + bhava reference har jawab mein mandatory hai.

RESPONSE TEMPLATE (internal guide):
[1 line empathy if needed]
[2-3 lines specific chart observation with graha+bhava]
[1-2 lines timing prediction]
[upay — 2 lines max — only if needed]
[1 follow-up if context lacking]
TOTAL: 4-8 lines usually. NEVER an essay.
`.trim();

// ──────────────────────────────────────────
// KUNDLI CONTEXT BUILDER
// ──────────────────────────────────────────
export function buildKundliContext(kundli: KundliData, transits?: TransitData): string {
  const planetLines = Object.entries(kundli.planets)
    .map(([name, p]) =>
      `${name}: ${p.rashi} ${p.degreeFormatted} | ${p.house}H | ${p.isRetrograde ? 'Vakri(R)' : 'Margi'}${p.dignity ? ` | ${p.dignity}` : ''}`,
    )
    .join('\n');

  const transitLine = transits
    ? Object.entries(transits.planets)
        .map(([name, info]) =>
          `${name}: ${info.rashi} ${Math.floor(info.degrees)}°${info.isRetrograde ? 'R' : ''}`,
        )
        .join(' | ')
    : 'Transit data unavailable';

  const bhavaLine = (kundli.bhavas || [])
    .map(b => `${b.bhava}H=${b.rashiName}`)
    .join(' | ');

  return `=== KUNDLI — ${kundli.name} ===
Janam: ${kundli.dob} | ${kundli.tob} IST | ${kundli.pob}
Lagna: ${kundli.lagna}${kundli.lagnaDegreeFormatted ? ` (${kundli.lagnaDegreeFormatted})` : ''} | Navamsa: ${kundli.navamsaLagna || 'N/A'}
Janma Rashi: ${kundli.rashi} | Nakshatra: ${kundli.nakshatra} Pada ${kundli.nakshatraPada}

GRAHA (Sidereal Lahiri):
${planetLines}

BHAVAS (Whole-Sign):
${bhavaLine}

DASHA:
${kundli.currentDasha.lord} Mahadasha (${kundli.currentDasha.startDate}–${kundli.currentDasha.endDate})
${kundli.currentDasha.antardasha.lord} Antardasha (till ${kundli.currentDasha.antardasha.endDate})

GOCHAR TODAY (${todayIST()}):
${transitLine}
=== KUNDLI SAMPT ===

Upar ke EXACT data ke aadhar par jawab do. Specific graha+bhava+dasha reference mandatory.`.trim();
}

// ──────────────────────────────────────────
// TRANSIT DATA TYPE
// ──────────────────────────────────────────
export interface TransitData {
  date: string;
  planets: Record<string, {
    rashi: string;
    degrees: number;
    isRetrograde: boolean;
    nakshatra: string;
  }>;
  yogas?: string[];
  ayanamsa?: number;
}

// Legacy export for backward compat
export function buildSystemPrompt(kundli: KundliData, transits?: TransitData): string {
  return PANDIT_SYSTEM_PROMPT + '\n\n' + buildKundliContext(kundli, transits);
}

export function buildRashifalPrompt(rashi: string, transits?: TransitData): string {
  const today = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const transitLines = transits
    ? Object.entries(transits.planets)
        .map(([name, info]) => `${name}: ${info.rashi} ${Math.floor(info.degrees)}°${info.isRetrograde ? ' (Vakri)' : ''} — ${info.nakshatra}`)
        .join('\n')
    : 'Transit data unavailable';

  return `Aaj: ${today}
${rashi} rashi — transit data:
${transitLines}
Return ONLY JSON: { "general": string, "career": string, "love": string, "health": string, "upay": string, "lucky": { "color": string, "number": number, "time": string }, "rating": number }`;
}
