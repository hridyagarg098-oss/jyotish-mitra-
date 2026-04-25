'use client';

import type { KundliData, PlanetPosition } from '@/lib/astro/kundliEngine';
import { EXALTATION, DEBILITATION } from '@/lib/astro/constants';

const GEMSTONE_MAP: Record<string, { stone: string; finger: string; metal: string; day: string }> = {
  Surya:  { stone: 'Manikya (Ruby)', finger: 'Anamika (Ring)', metal: 'Sone (Gold)', day: 'Ravivar' },
  Chandra:{ stone: 'Moti (Pearl)', finger: 'Kanishtha (Little)', metal: 'Chandi (Silver)', day: 'Somvar' },
  Mangal: { stone: 'Moonga (Red Coral)', finger: 'Anamika (Ring)', metal: 'Sonay ki mishrit dhatu', day: 'Mangalvar' },
  Budh:   { stone: 'Panna (Emerald)', finger: 'Kanishtha (Little)', metal: 'Sone mein (Gold)', day: 'Budhvar' },
  Guru:   { stone: 'Pukhraj (Yellow Sapphire)', finger: 'Tarjani (Index)', metal: 'Sone mein (Gold)', day: 'Guruvar' },
  Shukra: { stone: 'Heera (Diamond) / Opal', finger: 'Madhyama (Middle)', metal: 'Platinum/Silver', day: 'Shukravar' },
  Shani:  { stone: 'Neelam (Blue Sapphire)', finger: 'Madhyama (Middle)', metal: 'Lohe mein (Iron)', day: 'Shanivar' },
  Rahu:   { stone: 'Hessonite (Gomed)', finger: 'Madhyama (Middle)', metal: 'Panchdhatu', day: 'Shanivar' },
  Ketu:   { stone: 'Lahsunia (Cat\'s Eye)', finger: 'Kanishtha (Little)', metal: 'Panchdhatu', day: 'Mangalvar' },
};

const MANTRA_MAP: Record<string, { mantra: string; transliteration: string; day: string; count: string }> = {
  Surya: { mantra: 'ॐ हृां हृीं हृौं सः सूर्याय नमः', transliteration: 'Om Hraam Hreem Hroum Sah Suryaya Namah', day: 'Ravivar', count: '108' },
  Chandra: { mantra: 'ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः', transliteration: 'Om Shraam Shreem Shroum Sah Chandramase Namah', day: 'Somvar', count: '108' },
  Mangal: { mantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः', transliteration: 'Om Kraam Kreem Kroum Sah Bhaumaya Namah', day: 'Mangalvar', count: '108' },
  Shani: { mantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः', transliteration: 'Om Praam Preem Proum Sah Shanaischaraya Namah', day: 'Shanivar', count: '108' },
  Rahu: { mantra: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः', transliteration: 'Om Bhraam Bhreem Bhroum Sah Rahave Namah', day: 'Shanivar', count: '108' },
  Ketu: { mantra: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः', transliteration: 'Om Sraam Sreem Sroum Sah Ketave Namah', day: 'Mangalvar', count: '108' },
};

function getWeakPlanets(kundli: KundliData): PlanetPosition[] {
  return Object.values(kundli.planets).filter(p =>
    p.dignity === 'Neecha' || (p.isRetrograde && p.name !== 'Rahu' && p.name !== 'Ketu')
  );
}

export default function UpayTab({ kundli }: { kundli: KundliData }) {
  const weakPlanets = getWeakPlanets(kundli);
  const relevantPlanets = weakPlanets.length > 0 ? weakPlanets : [kundli.planets.Shani, kundli.planets.Rahu].filter(Boolean);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Upay & Ratna</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
          {weakPlanets.length > 0
            ? `${weakPlanets.length} kamzor graha milein hain — inke upay karein`
            : 'Aapke pramukh graha ke upay aur ratna'}
        </p>
      </div>

      {/* Gemstone recommendations */}
      <div style={{ marginBottom: 32 }}>
        <p className="label-caps" style={{ marginBottom: 16 }}>💎 Ratna Recommendation</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {relevantPlanets.slice(0, 4).map(planet => {
            const gem = GEMSTONE_MAP[planet.name];
            if (!gem) return null;
            return (
              <div key={planet.name} className="gold-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20, color: planet.color }}>{planet.symbol}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-devanagari)', fontSize: 16, color: 'var(--gold-bright)' }}>
                      {planet.nameDevanagari}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {planet.dignity === 'Neecha' ? '⚠️ Neecha (Debilitated)' : planet.isRetrograde ? '↩ Vakri (Retrograde)' : 'Recommended graha'}
                    </p>
                  </div>
                </div>
                <p className="label-caps" style={{ marginBottom: 4 }}>Ratna</p>
                <p style={{ fontSize: 16, color: 'var(--gold-bright)', fontWeight: 600, marginBottom: 12 }}>
                  💎 {gem.stone}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div><p style={{ color: 'var(--text-3)' }}>Ungli</p><p style={{ color: 'var(--text-1)' }}>{gem.finger}</p></div>
                  <div><p style={{ color: 'var(--text-3)' }}>Dhatu</p><p style={{ color: 'var(--text-1)' }}>{gem.metal}</p></div>
                  <div><p style={{ color: 'var(--text-3)' }}>Pehnne ka din</p><p style={{ color: 'var(--text-1)' }}>{gem.day}</p></div>
                  <div><p style={{ color: 'var(--text-3)' }}>Wajan</p><p style={{ color: 'var(--text-1)' }}>3–6 Ratti</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mantras */}
      <div style={{ marginBottom: 32 }}>
        <p className="label-caps" style={{ marginBottom: 16 }}>🔔 Mantra Jaap</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {relevantPlanets.slice(0, 3).map(planet => {
            const m = MANTRA_MAP[planet.name];
            if (!m) return null;
            return (
              <div key={planet.name} className="gold-card">
                <div style={{
                  fontFamily: 'var(--font-devanagari)',
                  fontSize: 18, color: 'var(--gold-bright)',
                  marginBottom: 8, lineHeight: 1.6,
                }}>
                  {m.mantra}
                </div>
                <p style={{
                  fontStyle: 'italic', fontSize: 13,
                  color: 'var(--text-2)', marginBottom: 8,
                }}>
                  {m.transliteration}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {m.count} baar jaap karein · {m.day} ke din · Surya udaya ke samay
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daana section */}
      <div>
        <p className="label-caps" style={{ marginBottom: 16 }}>🙏 Daana (Charity)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { planet: 'Surya', daana: 'Gehun (wheat), Gur (jaggery)', din: 'Ravivar', ko: 'Brahmins ya temple' },
            { planet: 'Shani', daana: 'Sarson ka tel, Kale til, Loha', din: 'Shanivar', ko: 'Garibon ko' },
            { planet: 'Rahu', daana: 'Sarso, Mooli, Naarial', din: 'Shanivar', ko: 'Acche karya mein' },
          ].map(({ planet, daana, din, ko }) => (
            <div key={planet} className="gold-card" style={{ padding: '16px' }}>
              <p style={{ fontWeight: 600, color: 'var(--gold-bright)', marginBottom: 6 }}>{planet}</p>
              <p style={{ fontSize: 13, color: 'var(--text-1)', marginBottom: 4 }}>🎁 {daana}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>📅 {din} · 👉 {ko}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
