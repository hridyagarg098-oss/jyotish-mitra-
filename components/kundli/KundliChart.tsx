'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { KundliData, PlanetPosition } from '@/lib/astro/kundliEngine';
import { HOUSE_CENTERS } from '@/lib/astro/constants';

interface Props {
  kundli: KundliData;
  size?: number;
  mini?: boolean;
}

// Collect planets by house for rendering
function getPlanetsByHouse(planets: KundliData['planets']): Record<number, PlanetPosition[]> {
  const byHouse: Record<number, PlanetPosition[]> = {};
  Object.values(planets).forEach(planet => {
    const h = planet.house;
    if (!byHouse[h]) byHouse[h] = [];
    byHouse[h].push(planet);
  });
  return byHouse;
}

const CHART_LINES = {
  // Outer border
  border: 'M0,0 L340,0 L340,340 L0,340 Z',
  // Grid
  grid: [
    // Horizontals
    'M0,85 L340,85', 'M0,170 L340,170', 'M0,255 L340,255',
    // Verticals
    'M85,0 L85,340', 'M170,0 L170,340', 'M255,0 L255,340',
  ],
  // Corner diagonals
  diagonals: [
    'M0,85 L85,0',       // Top-left
    'M255,0 L340,85',    // Top-right
    'M0,255 L85,340',    // Bottom-left
    'M255,340 L340,255', // Bottom-right
  ],
  // Inner diamond
  diamond: [
    'M170,85 L255,170',
    'M255,170 L170,255',
    'M170,255 L85,170',
    'M85,170 L170,85',
  ],
};

export default function KundliChart({ kundli, size = 340, mini = false }: Props) {
  const scale = size / 340;
  const planetsByHouse = getPlanetsByHouse(kundli.planets);

  // House labels: what rashi is in each house
  const houseRashis: Record<number, string> = {};
  for (let h = 1; h <= 12; h++) {
    const rashiNum = (kundli.lagnaNum + h - 1) % 12;
    houseRashis[h] = String(rashiNum + 1);
  }

  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1, transition: { duration: 1.5, ease: 'easeInOut' } },
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 1.5, duration: 0.5 } },
  };

  return (
    <motion.svg
      viewBox="0 0 340 340"
      width={size}
      height={size}
      initial="hidden"
      animate="visible"
      className="kundli-chart"
      style={{
        background: 'var(--bg-1)',
        borderRadius: mini ? 8 : 12,
        border: '1px solid var(--gold-border)',
      }}
    >
      {/* Background */}
      <rect x="0" y="0" width="340" height="340" fill="var(--bg-1)" />

      {/* Grid lines */}
      {CHART_LINES.grid.map((d, i) => (
        <motion.path key={`grid-${i}`} d={d} variants={lineVariants} strokeWidth="0.8" />
      ))}

      {/* Corner diagonals */}
      {CHART_LINES.diagonals.map((d, i) => (
        <motion.path key={`diag-${i}`} d={d} variants={lineVariants} strokeWidth="0.8" />
      ))}

      {/* Inner diamond */}
      {CHART_LINES.diamond.map((d, i) => (
        <motion.path key={`dia-${i}`} d={d} variants={lineVariants} strokeWidth="0.8" />
      ))}

      {/* Outer border */}
      <motion.rect x="0.5" y="0.5" width="339" height="339" variants={lineVariants} strokeWidth="1" />

      {/* House numbers (tiny, muted) */}
      {!mini && Object.entries(HOUSE_CENTERS).map(([house, [cx, cy]]) => (
        <motion.text
          key={`house-num-${house}`}
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fontSize="8"
          fill="rgba(245,236,215,0.2)"
          fontFamily="var(--font-body)"
          variants={textVariants}
        >
          {house}
        </motion.text>
      ))}

      {/* Planet positions */}
      {Object.entries(planetsByHouse).map(([houseStr, planets]) => {
        const house = parseInt(houseStr);
        const [cx, cy] = HOUSE_CENTERS[house] || [170, 170];
        const count = planets.length;

        return planets.map((planet, idx) => {
          // Offset multiple planets in the same house
          const offsetX = count > 1 ? (idx - (count - 1) / 2) * 16 : 0;
          const offsetY = count > 2 ? (idx > 1 ? 14 : 0) : 0;
          const px = cx + offsetX;
          const py = cy + (mini ? 0 : 4) + offsetY;

          const label = planet.abbr + (planet.isRetrograde ? '(व)' : '');

          return (
            <motion.g key={planet.name} variants={textVariants}>
              <text
                x={px}
                y={py}
                textAnchor="middle"
                fontSize={mini ? 10 : 13}
                fill={planet.dignity === 'Ucha' ? '#27ae60' : planet.dignity === 'Neecha' ? '#c0392b' : 'var(--gold-bright)'}
                fontFamily="var(--font-devanagari)"
                style={{ cursor: 'default' }}
              >
                {label}
              </text>
            </motion.g>
          );
        });
      })}

      {/* Center — user name + DOB */}
      {!mini && (
        <motion.g variants={textVariants}>
          <text
            x="170" y="163"
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="var(--gold-bright)"
            fontFamily="var(--font-display)"
          >
            {kundli.name.split(' ')[0]}
          </text>
          <text
            x="170" y="180"
            textAnchor="middle"
            fontSize="9"
            fill="var(--text-3)"
            fontFamily="var(--font-body)"
          >
            {kundli.dob}
          </text>
          <text
            x="170" y="193"
            textAnchor="middle"
            fontSize="9"
            fill="var(--text-3)"
            fontFamily="var(--font-body)"
          >
            {kundli.tob} · {kundli.pob.split(',')[0]}
          </text>
        </motion.g>
      )}

      {/* Lagna indicator */}
      {!mini && (
        <motion.text
          x="170" y="30"
          textAnchor="middle"
          fontSize="8"
          fill="var(--gold-mid)"
          fontFamily="var(--font-body)"
          letterSpacing="1"
          variants={textVariants}
        >
          LAGNA
        </motion.text>
      )}
    </motion.svg>
  );
}
