'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KundliData } from '@/lib/astro/kundliEngine';
import KundliChart from '@/components/kundli/KundliChart';
import DashaTimeline from '@/components/kundli/DashaTimeline';
import PlanetTable from '@/components/kundli/PlanetTable';
import RashifalTab from './RashifalTab';
import MilanTab from './MilanTab';
import UpayTab from './UpayTab';

interface Props {
  kundli: KundliData;
  plan: string;
  userId: string;
}

const TABS = ['Kundli Vishleshan', 'Rashifal', 'Kundli Milan', 'Upay & Ratna'];

function InitialAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      background: 'var(--bg-3)',
      border: '2px solid var(--gold-mid)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 20, fontWeight: 600,
      color: 'var(--gold-bright)',
    }}>
      {initials}
    </div>
  );
}

function WhatsAppShare({ kundli }: { kundli: KundliData }) {
  const text = `✨ Meri Janma Kundli — Jyotish Mitra se\n\nNaam: ${kundli.name}\nRashi: ${kundli.rashi}\nLagna: ${kundli.lagna}\nNakshatra: ${kundli.nakshatra}\nCurrent Dasha: ${kundli.currentDasha?.lord}\n\nApni kundli banao: ${process.env.NEXT_PUBLIC_APP_URL || 'https://jyotishmitra.in'}/kundli`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        background: 'rgba(37,211,102,0.1)',
        border: '1px solid rgba(37,211,102,0.3)',
        borderRadius: 10,
        color: '#25D166',
        textDecoration: 'none',
        fontSize: 13, fontWeight: 500,
        transition: 'background 0.2s',
        marginTop: 12,
      }}
    >
      <span style={{ fontSize: 16 }}>📱</span>
      WhatsApp pe Share Karein
    </a>
  );
}

export default function DashboardClient({ kundli, plan, userId }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* ── LEFT SIDEBAR ── */}
      <aside style={{
        width: 360,
        flexShrink: 0,
        borderRight: '1px solid var(--gold-border)',
        padding: '28px 20px',
        overflowY: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        background: 'rgba(8,2,15,0.6)',
        backdropFilter: 'blur(12px)',
      }}>
        {/* User card */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <InitialAvatar name={kundli.name} />
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20, fontWeight: 600,
                color: 'var(--gold-bright)',
                marginBottom: 2,
              }}>
                {kundli.name}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{kundli.dob}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{kundli.tob} IST · {kundli.pob}</p>
            </div>
          </div>

          {/* Rashi/Lagna/Nakshatra pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className="pill" style={{ fontSize: 11 }}>
              ☽ {kundli.rashi} Rashi
            </span>
            <span className="pill" style={{ fontSize: 11 }}>
              ↑ {kundli.lagna} Lagna
            </span>
            <span className="pill" style={{ fontSize: 11 }}>
              ✦ {kundli.nakshatra}
            </span>
          </div>
        </div>

        <div className="gold-divider" style={{ marginBottom: 20 }} />

        {/* Kundli Chart */}
        <div style={{ marginBottom: 24 }}>
          <p className="label-caps" style={{ marginBottom: 10 }}>Lagna Chart (D1)</p>
          <KundliChart kundli={kundli} size={320} />
        </div>

        <div className="gold-divider" style={{ marginBottom: 20 }} />

        {/* Dasha Timeline */}
        <DashaTimeline kundli={kundli} />

        <div className="gold-divider" style={{ margin: '20px 0' }} />

        {/* WhatsApp Share */}
        <WhatsAppShare kundli={kundli} />

        {/* App info */}
        <div style={{
          marginTop: 16,
          padding: '14px 16px',
          background: 'var(--gold-dim)',
          border: '1px solid var(--gold-border)',
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 13, color: 'var(--gold-bright)', fontWeight: 500, marginBottom: 4 }}>
            ✦ Jyotish Mitra
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-2)' }}>
            Unlimited AI Pandit · Unlimited Kundli
          </p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {/* Tab bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(8,2,15,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--gold-border)',
          padding: '12px 28px',
        }}>
          <div className="tab-bar" style={{ display: 'inline-flex' }}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className={`tab-item${activeTab === i ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
                style={{ position: 'relative' }}
              >
                {activeTab === i && (
                  <motion.div
                    layoutId="tab-bg"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--gold-mid)',
                      borderRadius: 8,
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '28px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 0 && <KundliVishleshan kundli={kundli} />}
              {activeTab === 1 && <RashifalTab kundli={kundli} />}
              {activeTab === 2 && <MilanTab kundli={kundli} userId={userId} />}
              {activeTab === 3 && <UpayTab kundli={kundli} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── TAB 1: KUNDLI VISHLESHAN ───
function KundliVishleshan({ kundli }: { kundli: KundliData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* AI Insight Banner */}
      <div className="gold-card" style={{
        background: 'var(--gold-dim)',
        borderColor: 'var(--gold-border-strong)',
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>✦</span>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 17, color: 'var(--gold-bright)',
            marginBottom: 6,
          }}>
            Pandit AI Vishleshan
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
            Aapka <strong style={{ color: 'var(--gold-bright)' }}>{kundli.currentDasha?.lord} Mahadasha</strong> chal raha hai.{' '}
            {kundli.nakshatra} nakshatra mein janma lete hain aap —{' '}
            iske lord <strong style={{ color: 'var(--gold-bright)' }}>{kundli.nakshatraLord}</strong> hain.{' '}
            AI Pandit se poochho ki ye dasha aapke liye kya leke aaya hai.
          </p>
        </div>
        <button
          className="btn-ghost"
          style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}
          onClick={() => document.getElementById('chat-trigger-btn')?.click()}
        >
          Pooch lo →
        </button>
      </div>

      {/* Planet Table */}
      <div className="gold-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gold-border)' }}>
          <p className="label-caps">Graha Sthiti — Planetary Positions</p>
        </div>
        <PlanetTable kundli={kundli} />
      </div>
    </div>
  );
}
