'use client';

import type { KundliData, PlanetPosition } from '@/lib/astro/kundliEngine';

interface Props { kundli: KundliData; }

function DignityBadge({ dignity, devanagari }: { dignity: string | null; devanagari: string | null }) {
  if (!dignity) return <span style={{ color: 'var(--text-3)' }}>—</span>;
  const colors: Record<string, string> = {
    Ucha: '#27ae60', Neecha: '#c0392b', Swakshetra: '#f39c12',
  };
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      color: colors[dignity] || 'var(--text-2)',
      fontFamily: 'var(--font-devanagari)',
    }}>
      {devanagari}
    </span>
  );
}

function HouseCell({ house }: { house: number }) {
  const isKendra = [1, 4, 7, 10].includes(house);
  const isKona = [1, 5, 9].includes(house);
  return (
    <span style={{
      fontWeight: isKendra ? 700 : 400,
      color: isKendra ? 'var(--gold-bright)' : isKona ? '#f39c12' : 'var(--text-2)',
    }}>
      {house}
      {isKendra ? ' ⬛' : isKona ? ' △' : ''}
    </span>
  );
}

const PLANET_ORDER = ['Surya', 'Chandra', 'Mangal', 'Budh', 'Guru', 'Shukra', 'Shani', 'Rahu', 'Ketu'];

export default function PlanetTable({ kundli }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--gold-border)' }}>
            {['Graha', 'Rashi', 'Bhava', 'Sthiti', 'Degree'].map(col => (
              <th key={col} style={{
                padding: '10px 12px',
                textAlign: 'left',
                fontSize: 10,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
                whiteSpace: 'nowrap',
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLANET_ORDER.map((pName, idx) => {
            const planet = kundli.planets[pName as keyof typeof kundli.planets];
            if (!planet) return null;
            const isEven = idx % 2 === 0;
            return (
              <tr
                key={pName}
                style={{
                  background: isEven ? 'var(--bg-2)' : 'var(--bg-3)',
                  borderBottom: '1px solid var(--gold-border)',
                  transition: 'background 0.15s',
                  borderLeft: '3px solid transparent',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderLeftColor = 'var(--gold-mid)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.background = isEven ? 'var(--bg-2)' : 'var(--bg-3)';
                }}
              >
                {/* Graha */}
                <td style={{ padding: '12px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, color: planet.color }}>
                      {planet.symbol}
                    </span>
                    <div>
                      <div style={{
                        fontSize: 13, fontWeight: 500,
                        fontFamily: 'var(--font-devanagari)',
                        color: 'var(--text-1)',
                      }}>
                        {planet.nameDevanagari}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {planet.nameEnglish}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Rashi */}
                <td style={{ padding: '12px 12px' }}>
                  <div style={{
                    fontSize: 13,
                    fontFamily: 'var(--font-devanagari)',
                    color: 'var(--text-1)',
                  }}>
                    {planet.rashiDevanagari}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {planet.rashiEnglish}
                  </div>
                </td>

                {/* Bhava */}
                <td style={{ padding: '12px 12px' }}>
                  <HouseCell house={planet.house} />
                </td>

                {/* Sthiti */}
                <td style={{ padding: '12px 12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <DignityBadge dignity={planet.dignity} devanagari={planet.dignityDevanagari} />
                    {planet.isRetrograde && (
                      <span style={{ fontSize: 10, color: '#f39c12' }}>(व) Vakri</span>
                    )}
                  </div>
                </td>

                {/* Degree */}
                <td style={{ padding: '12px 12px', color: 'var(--text-2)', fontSize: 13 }}>
                  {planet.degreeFormatted}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, padding: '10px 12px',
        fontSize: 11, color: 'var(--text-3)',
        borderTop: '1px solid var(--gold-border)',
        flexWrap: 'wrap',
      }}>
        <span>⬛ Kendra (1,4,7,10)</span>
        <span>△ Kona (1,5,9)</span>
        <span style={{ color: '#27ae60' }}>उच्च Exalted</span>
        <span style={{ color: '#c0392b' }}>नीच Debilitated</span>
        <span style={{ color: '#f39c12' }}>स्वक्षेत्र Own Sign</span>
      </div>
    </div>
  );
}
