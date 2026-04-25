'use client';

import { useEffect, useState } from 'react';
import type { KundliData } from '@/lib/astro/kundliEngine';

interface RashifalData {
  general: string; career: string; love: string; health: string;
  lucky: { color: string; number: number; time: string };
  rating: number;
}

export default function RashifalTab({ kundli }: { kundli: KundliData }) {
  const [data, setData] = useState<RashifalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rashi = kundli.rashi?.toLowerCase().replace(' ', '_');
    fetch(`/api/rashifal?rashi=${rashi}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [kundli.rashi]);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
      <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse-om 2s infinite' }}>☽</div>
      <p>Aaj ka rashifal load ho raha hai...</p>
    </div>
  );

  if (!data) return <p style={{ color: 'var(--text-2)' }}>Rashifal load nahi ho saka.</p>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h2 style={{ fontSize: 28, color: 'var(--gold-bright)' }}>
            {kundli.rashi} Rashifal
          </h2>
          <span style={{ color: '#f39c12', fontSize: 18 }}>
            {'★'.repeat(data.rating)}{'☆'.repeat(5 - data.rating)}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{today}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '🌟', label: 'Samanya', key: 'general' as const },
          { icon: '💼', label: 'Career', key: 'career' as const },
          { icon: '💕', label: 'Prem & Rishte', key: 'love' as const },
          { icon: '🌿', label: 'Swasthya', key: 'health' as const },
        ].map(({ icon, label, key }) => (
          <div key={key} className="gold-card">
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <p className="label-caps" style={{ marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.7 }}>{data[key]}</p>
          </div>
        ))}
      </div>

      {/* Lucky section */}
      <div className="gold-card" style={{
        background: 'var(--gold-dim)',
        display: 'flex', gap: 24, flexWrap: 'wrap',
      }}>
        <div>
          <p className="label-caps" style={{ marginBottom: 4 }}>Lucky Color</p>
          <p style={{ fontSize: 18, color: 'var(--gold-bright)', fontWeight: 600 }}>{data.lucky.color}</p>
        </div>
        <div>
          <p className="label-caps" style={{ marginBottom: 4 }}>Lucky Number</p>
          <p style={{ fontSize: 18, color: 'var(--gold-bright)', fontWeight: 600 }}>{data.lucky.number}</p>
        </div>
        <div>
          <p className="label-caps" style={{ marginBottom: 4 }}>Lucky Time</p>
          <p style={{ fontSize: 18, color: 'var(--gold-bright)', fontWeight: 600 }}>{data.lucky.time}</p>
        </div>
      </div>
    </div>
  );
}
