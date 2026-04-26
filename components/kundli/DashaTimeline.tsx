'use client';
// IST-first: all times are India Standard Time (UTC+5:30) — see /lib/ist-utils.ts

import { useMemo } from 'react';
import type { KundliData, DashaPeriod } from '@/lib/astro/kundliEngine';
import { PLANET_COLORS } from '@/lib/astro/constants';

// IST "now" for client-side use (avoids UTC midnight blip at 5:30 AM IST)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function nowISTTime(): number {
  return Date.now() + IST_OFFSET_MS;
}

interface Props {
  kundli: KundliData;
}

function getProgressPercent(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = nowISTTime(); // IST-corrected
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function formatYear(dateStr: string): string {
  return new Date(dateStr).getFullYear().toString();
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', // always show in IST
    month: 'short', year: 'numeric',
  });
}

export default function DashaTimeline({ kundli }: Props) {
  const { currentDasha, dashas } = kundli;
  const progress = getProgressPercent(currentDasha.startDate, currentDasha.endDate);
  const currentDashaFull = dashas.find(d => d.isCurrent);

  return (
    <div>
      {/* Current Mahadasha */}
      <div style={{ marginBottom: 20 }}>
        <p className="label-caps" style={{ marginBottom: 12 }}>Vimshottari Dasha</p>

        <div style={{
          padding: '16px 18px',
          background: 'var(--bg-3)',
          borderRadius: 12,
          border: '1px solid var(--gold-border-strong)',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              color: PLANET_COLORS[currentDasha.lord as keyof typeof PLANET_COLORS] || 'var(--gold-bright)',
            }}>
              {currentDasha.lord}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Mahadasha</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
            {formatDateShort(currentDasha.startDate)} – {formatDateShort(currentDasha.endDate)}
          </p>

          {/* Progress bar */}
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <div className="dasha-bar">
              <div
                className="dasha-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Current year pointer */}
            <div style={{
              position: 'absolute',
              left: `${progress}%`,
              top: -6,
              transform: 'translateX(-50%)',
              width: 2,
              height: 18,
              background: 'var(--gold-bright)',
              borderRadius: 1,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
            <span>{formatYear(currentDasha.startDate)}</span>
            <span style={{ color: 'var(--gold-bright)', fontWeight: 500 }}>{progress}% elapsed</span>
            <span>{formatYear(currentDasha.endDate)}</span>
          </div>
        </div>

        {/* Current Antardasha */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-2)',
          borderRadius: 8,
          border: '1px solid var(--gold-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Antardasha:</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gold-bright)' }}>
            {currentDasha.antardasha.lord}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
            till {formatDateShort(currentDasha.antardasha.endDate)}
          </span>
        </div>
      </div>

      {/* All 9 Dashas horizontal bar */}
      <div>
        <p className="label-caps" style={{ marginBottom: 10 }}>All Mahadashas</p>
        <div style={{ display: 'flex', gap: 2, borderRadius: 8, overflow: 'hidden' }}>
          {dashas.slice(0, 9).map((dasha) => (
            <div
              key={dasha.lord}
              title={`${dasha.lord}: ${formatYear(dasha.startDate)}–${formatYear(dasha.endDate)}`}
              style={{
                flex: dasha.years,
                height: dasha.isCurrent ? 32 : 24,
                background: PLANET_COLORS[dasha.lord as keyof typeof PLANET_COLORS] || '#888',
                opacity: dasha.isCurrent ? 1 : 0.35,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: '#fff',
                fontWeight: 600,
                cursor: 'default',
                border: dasha.isCurrent ? '2px solid var(--gold-bright)' : 'none',
                transition: 'height 0.2s',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {dasha.years >= 10 ? dasha.lord.slice(0, 3) : ''}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', fontSize: 9, color: 'var(--text-3)', marginTop: 4 }}>
          <span>{formatYear(dashas[0].startDate)}</span>
          <span style={{ marginLeft: 'auto' }}>{formatYear(dashas[8].endDate)}</span>
        </div>
      </div>

      {/* Next 3 upcoming dashas */}
      {currentDashaFull && (
        <div style={{ marginTop: 16 }}>
          <p className="label-caps" style={{ marginBottom: 10 }}>Upcoming</p>
          {dashas
            .filter(d => new Date(d.startDate) > new Date(currentDasha.endDate))
            .slice(0, 3)
            .map((d) => (
              <div
                key={d.lord}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--gold-border)',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: PLANET_COLORS[d.lord as keyof typeof PLANET_COLORS] || '#888',
                }} />
                <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{d.lord}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                  {formatYear(d.startDate)} – {formatYear(d.endDate)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
