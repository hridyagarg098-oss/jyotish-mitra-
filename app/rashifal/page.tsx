'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RASHIS, RASHIS_DEVANAGARI, RASHI_SYMBOLS, RASHI_ENGLISH, RASHI_ELEMENTS,
} from '@/lib/astro/constants';

interface RashifalData {
  general: string;
  career: string;
  love: string;
  health: string;
  lucky: { color: string; number: number; time: string };
  rating: number;
}

const ELEMENT_ICONS: Record<string, string> = {
  Fire: '🔥', Earth: '🌍', Air: '💨', Water: '💧',
};

function RashiCard({
  rashi, rashiIndex, isSelected, onClick,
}: {
  rashi: string; rashiIndex: number; isSelected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        background: isSelected ? 'var(--gold-dim)' : 'var(--bg-2)',
        border: `1px solid ${isSelected ? 'var(--gold-mid)' : 'var(--gold-border)'}`,
        borderRadius: 14,
        padding: '16px 10px',
        cursor: 'pointer',
        textAlign: 'center',
        width: '100%',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 0 16px rgba(186,117,23,0.2)' : 'none',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 6 }}>{RASHI_SYMBOLS[rashiIndex]}</div>
      <p style={{
        fontFamily: 'var(--font-devanagari)',
        fontSize: 14,
        color: isSelected ? 'var(--gold-bright)' : 'var(--text-1)',
        fontWeight: isSelected ? 600 : 400,
        marginBottom: 2,
      }}>
        {RASHIS_DEVANAGARI[rashiIndex]}
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
        {ELEMENT_ICONS[RASHI_ELEMENTS[rashiIndex]]} {rashi}
      </p>
    </motion.button>
  );
}

function RashifalContent() {
  const searchParams = useSearchParams();
  const rashiParam = searchParams.get('rashi');

  const initIndex = rashiParam
    ? RASHIS.findIndex(r => r.toLowerCase() === rashiParam.toLowerCase())
    : 0;

  const [selectedIndex, setSelectedIndex] = useState(initIndex >= 0 ? initIndex : 0);
  const [data, setData] = useState<RashifalData | null>(null);
  const [loading, setLoading] = useState(false);

  // IST-first: always show IST date, regardless of user device timezone
  const today = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    const rashi = RASHIS[selectedIndex].toLowerCase();
    setLoading(true);
    setData(null);
    fetch(`/api/rashifal?rashi=${rashi}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedIndex]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <span className="pill" style={{ marginBottom: 16, display: 'inline-flex' }}>☉ {today}</span>
        <h1 style={{ marginBottom: 12 }}>Aaj Ka Rashifal</h1>
        <p style={{ fontSize: 16, color: 'var(--text-2)' }}>
          Apni rashi chuniye aur aaj ka dainik rashifal padhiye
        </p>
      </div>

      {/* 12 rashi grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 10,
        marginBottom: 40,
      }}>
        {RASHIS.map((rashi, i) => (
          <RashiCard
            key={rashi}
            rashi={rashi}
            rashiIndex={i}
            isSelected={selectedIndex === i}
            onClick={() => setSelectedIndex(i)}
          />
        ))}
      </div>

      {/* Rashifal content */}
      <div>
        {/* Selected rashi header */}
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 28,
            padding: '20px 24px',
            background: 'var(--bg-2)',
            borderRadius: 16,
            border: '1px solid var(--gold-border-strong)',
          }}>
            <div style={{ fontSize: 48 }}>{RASHI_SYMBOLS[selectedIndex]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                <h2 style={{ fontSize: 32, color: 'var(--gold-bright)' }}>
                  {RASHIS[selectedIndex]}
                </h2>
                <span className="devanagari" style={{ fontSize: 20, color: 'var(--text-2)' }}>
                  {RASHIS_DEVANAGARI[selectedIndex]}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-3)' }}>
                  {RASHI_ENGLISH[selectedIndex]}
                </span>
              </div>
              {data && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#f39c12', fontSize: 16 }}>
                    {'★'.repeat(data.rating)}{'☆'.repeat(5 - data.rating)}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {data.rating}/5 stars aaj ke liye
                  </span>
                </div>
              )}
            </div>
            <Link href="/kundli" className="btn-primary" style={{ padding: '10px 20px', fontSize: 13, flexShrink: 0 }}>
              Personal Kundli →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
              <div style={{
                fontFamily: 'var(--font-devanagari)',
                fontSize: 32, marginBottom: 12,
                animation: 'pulse-om 2s infinite',
                color: 'var(--gold-bright)',
              }}>
                ☽
              </div>
              <p>Rashifal tayyar ho raha hai...</p>
            </div>
          ) : data ? (
            <>
              {/* 4 sections grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { icon: '🌟', label: 'Samanya / General', key: 'general' as const },
                  { icon: '💼', label: 'Career / Vyaapar', key: 'career' as const },
                  { icon: '💕', label: 'Prem aur Rishte', key: 'love' as const },
                  { icon: '🌿', label: 'Swasthya / Health', key: 'health' as const },
                ].map(({ icon, label, key }) => (
                  <motion.div
                    key={key}
                    className="gold-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 22 }}>{icon}</span>
                      <p className="label-caps">{label}</p>
                    </div>
                    <p style={{ fontSize: 15, color: 'var(--text-1)', lineHeight: 1.75 }}>
                      {data[key]}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Lucky numbers */}
              <motion.div
                className="gold-card"
                style={{
                  background: 'var(--gold-dim)',
                  display: 'flex',
                  gap: 0,
                  padding: 0,
                  overflow: 'hidden',
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {[
                  { emoji: '🎨', label: 'Lucky Color', value: data.lucky.color },
                  { emoji: '🔢', label: 'Lucky Number', value: String(data.lucky.number) },
                  { emoji: '⏰', label: 'Lucky Time', value: data.lucky.time },
                ].map(({ emoji, label, value }, i) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      padding: '20px 24px',
                      textAlign: 'center',
                      borderRight: i < 2 ? '1px solid var(--gold-border)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
                    <p className="label-caps" style={{ marginBottom: 6 }}>{label}</p>
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      color: 'var(--gold-bright)',
                      fontWeight: 600,
                    }}>
                      {value}
                    </p>
                  </div>
                ))}
              </motion.div>
            </>
          ) : (
            <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: 40 }}>
              Rashifal load nahi ho saka. Dobara try karein.
            </p>
          )}
        </motion.div>
      </div>

      {/* CTA at bottom */}
      <div style={{
        marginTop: 60,
        padding: '36px',
        background: 'var(--bg-2)',
        borderRadius: 20,
        border: '1px solid var(--gold-border)',
        textAlign: 'center',
      }}>
        <h3 style={{ marginBottom: 12 }}>Aur bhi jaanna chahte hain?</h3>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
          Personal kundli banayein aur AI Pandit se apni dasha, graha, aur bhavishya ke baare mein poochein.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/kundli" className="btn-primary" style={{ padding: '12px 28px' }}>
            Free Kundli Banayein ✦
          </Link>
          <Link href="/milan" className="btn-ghost" style={{ padding: '12px 28px' }}>
            Kundli Milan
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RashifalPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: 100, color: 'var(--text-3)' }}>
        Loading...
      </div>
    }>
      <RashifalContent />
    </Suspense>
  );
}
