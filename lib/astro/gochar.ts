// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts
// ═══════════════════════════════════════════
// GOCHAR (TRANSIT) ANALYSIS
// Classical results per BPHS and Phaladeepika
// Transit house counted FROM Janma Rashi (Moon sign)
// SERVER-SIDE ONLY
// ═══════════════════════════════════════════

export interface GocharEntry {
  planet: string;
  transitRashi: string;
  house: number;        // house from Janma Rashi
  result: string;       // classical phala in Hinglish
  isFavorable: boolean;
}

// ── Classical Gochar results from Janma Rashi ──────────────────────────────
// Sources: BPHS Ch.43-45, Phaladeepika, Brihat Jataka
// house = rashi position counted from Moon sign at birth
const GOCHAR: Record<string, Record<number, { result: string; favorable: boolean }>> = {
  Shani: {
    1:  { result: 'Sade Sati madhya — sharirik aur manasik chunautiyaan, swasthya dhyan dein', favorable: false },
    2:  { result: 'Aarthik tanav — kharche badhenge, vaani mein saavdhaani rakhein', favorable: false },
    3:  { result: 'Shubh — sahes, parakram, bhai-behano se laabh, yatra safal', favorable: true },
    4:  { result: 'Sade Sati arambh — ghar-parivaar mein tanav, maata ka swasthya', favorable: false },
    5:  { result: 'Santan chinta, vidya mein baadha, purane nivesh se nuksan', favorable: false },
    6:  { result: 'Shatru paraajay — rog se mukti, karz chukane mein safalta', favorable: true },
    7:  { result: 'Dampaty mein tanav, vyapar mein haani, yatraon mein saavdhaani', favorable: false },
    8:  { result: 'Ashtam Shani — gambhir — swasthya, durghatna, achanak haani ka yoga', favorable: false },
    9:  { result: 'Bhaagya mand, pita ko kasht, dharmik kaaryon mein baadha', favorable: false },
    10: { result: 'Career shubh — kathin parishram se safalta, promotion sambhav', favorable: true },
    11: { result: 'Aay laabh — icchaapoorti, mitron se laabh — sarvashreshth sthan', favorable: true },
    12: { result: 'Sade Sati ant — vyay, videsh yatra, ekaant ki or', favorable: false },
  },
  Guru: {
    1:  { result: 'Lagna par Guru — swasthya, vyaktitva, shubharambh, naye avsar', favorable: true },
    2:  { result: 'Dhan laabh, paarivaarik sukh, vaani mein madhurta, vyapar sahi', favorable: true },
    3:  { result: 'Bhai-behano se tanav, lekhan-yatra shubh nahi, parishram zaroori', favorable: false },
    4:  { result: 'Maata ko laabh, ghar mein shaanti, vaahan-sampatti yoga', favorable: true },
    5:  { result: 'Santan sukh, vidya-buddhi laabh, purane prem mein navareeneekarana', favorable: true },
    6:  { result: 'Rog-shatru vriddhi, seva mein avsar, vivad se bachein', favorable: false },
    7:  { result: 'Vivah yog, saajhedari laabh, jeevansaathi ka sahyog', favorable: true },
    8:  { result: 'Gupt gyaan, virasat, aayu raksha, guptvidya mein ruchi', favorable: false },
    9:  { result: 'Bhaagyoday — Guru 9ve mein sarvashreshth, dharm-yatra-safalta', favorable: true },
    10: { result: 'Career mein unnati, sarkari anugrah, maan-pratishtha milegi', favorable: true },
    11: { result: 'Aay aur icchaapoorti, bade lakshya siddh, labh stithi achi', favorable: true },
    12: { result: 'Vyay, videsh, aadhyatmik unnati, antarmukhi samay', favorable: false },
  },
  Mangal: {
    1:  { result: 'Krodh, durghatna, surgery ka yog, josh adhik — sambhal ke', favorable: false },
    2:  { result: 'Dhan haani, paarivaarik kalah, vaani katu — mouna faydemand', favorable: false },
    3:  { result: 'Sahes-parakram, bhai-behano se sahyog, yatra laabhdaayak', favorable: true },
    4:  { result: 'Ghar mein kalah, maata ko kasht, vaahan mein saavdhaani', favorable: false },
    5:  { result: 'Santan se tanav, prem-vichched, nirnay mein jaldbaazi se bachein', favorable: false },
    6:  { result: 'Shatru paraajay — 6ve mein Mangal shreshth, competition jeetenge', favorable: true },
    7:  { result: 'Dampaty kalah, vyapar mein jhagde, saajhidaar se vivad', favorable: false },
    8:  { result: 'Durghatna, operation, gupt shatru — vishesh saavdhaani zaruri', favorable: false },
    9:  { result: 'Dharm-pita par pratikool, anaavas shyak vivad se bachein', favorable: false },
    10: { result: 'Career mein sangharsh lekin safalta, netritva mil sakta hai', favorable: true },
    11: { result: 'Aay laabh, lakshya praapti, mitron se sahyog milega', favorable: true },
    12: { result: 'Vyay, videsh yatra, gupt shatru — kharche par dhyan rakhein', favorable: false },
  },
  Surya: {
    1:  { result: 'Swasthya par dhyan, self-confidence badhega, pitru kaarya shubh', favorable: true },
    2:  { result: 'Dhan maamle mein dhyan, vaani mein katu na hon', favorable: false },
    3:  { result: 'Bhai-behano se labh, sahes mein vriddhi, communication achhi', favorable: true },
    4:  { result: 'Ghar mein kuch tanav, maata ka dhyan rakhein', favorable: false },
    5:  { result: 'Santan ke liye shubh, purana prem jaagrut ho sakta hai', favorable: true },
    6:  { result: 'Rog-shatru par vijay, sehat theek, pratiyogita jeetenge', favorable: true },
    7:  { result: 'Jeevansaathi se matahed, partnership mein dhyan rakhein', favorable: false },
    8:  { result: 'Swasthya sambhal ke, aachanak aur kharche, pita ko kasht', favorable: false },
    9:  { result: 'Bhaagya uday, pitru ashirwad milega, dharmik kaarya shubh', favorable: true },
    10: { result: 'Career mein unnati, sarkari kaam, samaj mein maan milega', favorable: true },
    11: { result: 'Icchaapoorti, laabh, bade bhai se sahyog milega', favorable: true },
    12: { result: 'Vyay, ekaaant, dhyan-saadhnaa ka samay, kharche sambhalein', favorable: false },
  },
  Chandra: {
    1:  { result: 'Manasik sukh, new beginnings, bhavanaon mein tiver, maata ka sahyog', favorable: true },
    2:  { result: 'Parivaar ka dhyan, dhan ki aavak-jaavak', favorable: true },
    3:  { result: 'Yatra ke yog, bhai-behan se milna, lekhna achha', favorable: true },
    4:  { result: 'Ghar mein sukh, maata ka swasthya achha, shanti ka ehsaas', favorable: true },
    5:  { result: 'Prem-sambandh aur santan ke bare mein sochenge', favorable: true },
    6:  { result: 'Swasthya par dhyan, shatru se saavdhaani, tanav ho sakta hai', favorable: false },
    7:  { result: 'Jeevansaathi ka sahyog milega, rishton mein mithaas', favorable: true },
    8:  { result: 'Manasik bechain, nind kam, guptvidya mein ruchi', favorable: false },
    9:  { result: 'Dharmik kaarya, yatra, bhaagya ka sahyog, guru-puja shubh', favorable: true },
    10: { result: 'Kaam mein dhyan aur recognition, log poochenge aapka nirdesh', favorable: true },
    11: { result: 'Laabh aur ichhaapoorti, saheli-dost se milna', favorable: true },
    12: { result: 'Ekaaant, vishraant ki zaroorat, kharche ho sakte hain', favorable: false },
  },
  Budh: {
    1:  { result: 'Vaani, lekhna, vyapaar mein shubh — communication strong', favorable: true },
    2:  { result: 'Dhan aur parivaar ke bare mein naye vichaar, shrewd decisions', favorable: true },
    3:  { result: 'Yatra, lekhan, bhai-behan se sampark achha rahega', favorable: true },
    4:  { result: 'Ghar ki yojnaayein banaana, rented ya property deals sambhav', favorable: true },
    5:  { result: 'Shiksha mein unnati, prem mein samvaad — apni baat kahein', favorable: true },
    6:  { result: 'Shatru se vivad, sehat mein chhoti takleef — medicines se theek', favorable: false },
    7:  { result: 'Partnership aur contracts ke liye achha — sign karne ke yog', favorable: true },
    8:  { result: 'Research, gupt maamle, taax aur inheritance ke bare mein sochna', favorable: false },
    9:  { result: 'Dharmik lekhan, guru se seekh, videsh ke vichaar', favorable: true },
    10: { result: 'Kaam mein smart decisions, networking se faayda', favorable: true },
    11: { result: 'Laabh aur naye contacts, har kaam mein tejasvi buddhi', favorable: true },
    12: { result: 'Ekaaant mein sochna, gupt lekhan, kharche ka hisaab rakhein', favorable: false },
  },
  Shukra: {
    1:  { result: 'Soundarya, prem, vyaktitva mein nikhaar — social life achhi', favorable: true },
    2:  { result: 'Dhan laabh, parivaar mein mithaas, achha khaana-peena', favorable: true },
    3:  { result: 'Kala, sangeet, yatra shubh — bhai-behan se pyaar', favorable: true },
    4:  { result: 'Ghar mein sukh, property ka laabh, maata se prem', favorable: true },
    5:  { result: 'Naya prem, santan sukh, creativity badhegi, entertainment', favorable: true },
    6:  { result: 'Shatru maamlon mein dhyan, sehat sambhalein, karz se bachein', favorable: false },
    7:  { result: 'Vivah aur partnership ke liye sarvashreshth — prem milega', favorable: true },
    8:  { result: 'Guptdhan, virasat, aur sensual anubhav — lekin dhyan rakhein', favorable: false },
    9:  { result: 'Bhaagya, dharm, yatra, aur guru se shubh', favorable: true },
    10: { result: 'Career mein creativity se tarakki, public acclaim', favorable: true },
    11: { result: 'Laabh, dost-circles mein prem, ichhaapoorti', favorable: true },
    12: { result: 'Gupt prem, vyay, videsh — ekaaant mein anand', favorable: false },
  },
  Rahu: {
    1:  { result: 'Naye avsar lekin confusion — apni pehchaan ko madboot rakhein', favorable: false },
    2:  { result: 'Paisa aane ke unusual raaste, parivaar mein kuch asaamaanyata', favorable: false },
    3:  { result: 'Sahes, ambition badhega, media aur technology se laabh', favorable: true },
    4:  { result: 'Ghar mein achanak badlaav, maata ki chinta, relocation sambhav', favorable: false },
    5:  { result: 'Unconventional thinking, prem mein complexity, santan se vivad', favorable: false },
    6:  { result: 'Shatru par vijay, competitors ko harayenge, sehat thodi behtar', favorable: true },
    7:  { result: 'Partner foreign ya different background ka — relationship complex', favorable: false },
    8:  { result: 'Hidden resources milenge, research, occult mein deep interest', favorable: false },
    9:  { result: 'Dharm mein sandeh, pita se door, foreign connections milenge', favorable: false },
    10: { result: 'Career mein achaanak uthaan — foreign connections se laabh', favorable: true },
    11: { result: 'Laabh hoga lekin unconventional zariye se, networking powerful', favorable: true },
    12: { result: 'Videsh yatra, gupt kaarya, nind mein gadbadi', favorable: false },
  },
  Ketu: {
    1:  { result: 'Atma-chintan, sansaar se vairagya, spiritual seeking badhegi', favorable: false },
    2:  { result: 'Parivaar se thodi door, vaani mein kuch harshness', favorable: false },
    3:  { result: 'Bhai-behan se alag, akele chalenge — courage milega', favorable: false },
    4:  { result: 'Ghar mein ekaaant, maata se dur, property issues ho sakte hain', favorable: false },
    5:  { result: 'Purana prem khatam, santan se alag, creativity block', favorable: false },
    6:  { result: 'Shatru ki shakti kam — rog theek ho sakte hain, immunity achhi', favorable: true },
    7:  { result: 'Partner se distance, vivah mein deri, rishton mein coldness', favorable: false },
    8:  { result: 'Moksha ki or, gupt vidya, prarmbhik kasht par jeet', favorable: true },
    9:  { result: 'Purana guru ya dharm chhootega, naya spiritual path milega', favorable: false },
    10: { result: 'Career unstable, naye directions, job change sambhav', favorable: false },
    11: { result: 'Laabh thoda kam, achanak losses bhi — dhyan se chalen', favorable: false },
    12: { result: 'Moksha, videsh, ashram, aadhyatmik anubhav — shubh', favorable: true },
  },
};

const RASHIS = [
  'Mesh','Vrishabh','Mithun','Kark','Simha','Kanya',
  'Tula','Vrishchik','Dhanu','Makar','Kumbh','Meen',
];

/**
 * Analyze which house each transiting planet occupies from the natal Moon sign.
 * @param janmaRashiIndex  0–11 (natal Moon sign index)
 * @param transits         array of { planet, siderealDeg } from getTodayTransits()
 */
export function analyzeGochar(
  janmaRashiIndex: number,
  transits: { planet: string; siderealDeg: number; rashi: string }[],
): GocharEntry[] {
  return transits.map(t => {
    const transitRashiIndex = Math.floor(((t.siderealDeg % 360) + 360) % 360 / 30);
    const house = ((transitRashiIndex - janmaRashiIndex + 12) % 12) + 1;
    const phala = GOCHAR[t.planet]?.[house];

    return {
      planet: t.planet,
      transitRashi: RASHIS[transitRashiIndex],
      house,
      result: phala?.result ?? 'Samanya prabhav — vishesh parivartan nahi',
      isFavorable: phala?.favorable ?? true,
    };
  });
}

/**
 * Get Sade Sati status for a given janma rashi
 * Saturn transiting houses 12, 1, or 2 from Moon sign = Sade Sati
 */
export function getSadeSatiStatus(
  janmaRashiIndex: number,
  saturnSiderealDeg: number,
): { isActive: boolean; phase: string } {
  const saturnRashi = Math.floor(((saturnSiderealDeg % 360) + 360) % 360 / 30);
  const house = ((saturnRashi - janmaRashiIndex + 12) % 12) + 1;

  if (house === 12) return { isActive: true, phase: 'Arambh (Rising phase)' };
  if (house === 1)  return { isActive: true, phase: 'Madhya (Peak phase — sabse kathin)' };
  if (house === 2)  return { isActive: true, phase: 'Ant (Ending phase)' };
  if (house === 8)  return { isActive: false, phase: 'Dhaiya (small sade sati — 2.5 yr)' };
  return { isActive: false, phase: 'Active nahi' };
}
