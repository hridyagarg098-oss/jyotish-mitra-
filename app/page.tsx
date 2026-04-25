'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RASHIS, RASHIS_DEVANAGARI, RASHI_SYMBOLS, RASHI_ENGLISH } from '@/lib/astro/constants';

const STATS = [
  { num: '50,000+', label: 'Kundlis Banaayi' },
  { num: '9', label: 'Grahas Analyzed' },
  { num: '12', label: 'Rashis Covered' },
  { num: '24/7', label: 'AI Pandit Available' },
];

const TESTIMONIALS = [
  { name: 'Rahul S.', city: 'Chandigarh', quote: 'Bilkul sahi bata diya! Meri Shani dasha ke baare mein jo kaha woh 100% sach tha.' },
  { name: 'Priya M.', city: 'Mumbai', quote: 'AI Pandit ne mere career ke baare mein jo predictions diye, sach mein bahut helpful raha.' },
  { name: 'Arjun K.', city: 'Delhi', quote: 'Kundli Milan bahut accurate laga. Guna score bilkul sahi aaya hamare liye.' },
];

const FEATURES = [
  { icon: '☉', title: 'Asli Vedic Kundli', desc: 'Parashari shastra aadhaarit calculations. Lahiri Ayanamsa. 9 grahas ki sateek sthiti.' },
  { icon: '☽', title: 'Vimshottari Dasha', desc: 'Apna current aur future dasha janiye. Antardasha ke timing ke saath.' },
  { icon: '✦', title: 'AI Pandit Chat', desc: 'Aapki personal kundli ke hisaab se jawab. Hinglish mein, 24 ghante.' },
  { icon: '♥', title: 'Kundli Milan', desc: 'Ashtakoot Milan — 36 gunas ka poora analysis. Nadi Dosha detection.' },
  { icon: '☀', title: 'Daily Rashifal', desc: 'Har roz apni rashi ka prediction. Career, love, health, lucky time.' },
  { icon: '💎', title: 'Upay & Ratna', desc: 'Kamzor graha ke liye gemstone, mantra, aur daana suggestions.' },
];

// Rotating Mandala SVG
function Mandala() {
  const RASHIS_ON_RING = RASHIS_DEVANAGARI;
  return (
    <div style={{ position: 'relative', width: 480, height: 480, flexShrink: 0 }}>
      <svg viewBox="0 0 480 480" width="480" height="480">
        {/* Outer glow */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Concentric circles */}
        <circle cx="240" cy="240" r="220" stroke="rgba(186,117,23,0.2)" strokeWidth="1" fill="none"/>
        <circle cx="240" cy="240" r="180" stroke="rgba(186,117,23,0.3)" strokeWidth="0.8" fill="none"/>
        <circle cx="240" cy="240" r="130" stroke="rgba(186,117,23,0.4)" strokeWidth="0.6" fill="none"/>

        {/* Outer rotating group */}
        <g style={{ transformOrigin: '240px 240px', animation: 'orbit 80s linear infinite' }}>
          {/* 12 radial lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 240 + Math.cos(angle) * 130;
            const y1 = 240 + Math.sin(angle) * 130;
            const x2 = 240 + Math.cos(angle) * 220;
            const y2 = 240 + Math.sin(angle) * 220;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(186,117,23,0.3)" strokeWidth="0.5"/>;
          })}

          {/* 12 rashi symbols at outer ring */}
          {RASHIS_ON_RING.map((rashi, i) => {
            const angle = ((i * 30 - 90) * Math.PI) / 180;
            const x = 240 + Math.cos(angle) * 200;
            const y = 240 + Math.sin(angle) * 200;
            return (
              <text
                key={i}
                x={x} y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fill="rgba(250,199,117,0.75)"
                fontFamily="'Noto Sans Devanagari', sans-serif"
                style={{ animation: `orbit 80s linear infinite reverse`, transformOrigin: `${x}px ${y}px` }}
              >
                {rashi}
              </text>
            );
          })}
        </g>

        {/* Inner diamond — counter-rotate */}
        <g style={{ transformOrigin: '240px 240px', animation: 'orbit 120s linear infinite reverse' }}>
          <polygon
            points="240,110 370,240 240,370 110,240"
            stroke="rgba(186,117,23,0.5)"
            strokeWidth="0.8"
            fill="none"
          />
        </g>

        {/* 9 planet dots on middle ring */}
        {[
          { color: '#e67e22', angle: 0 }, { color: '#bdc3c7', angle: 40 },
          { color: '#c0392b', angle: 80 }, { color: '#27ae60', angle: 120 },
          { color: '#f39c12', angle: 160 }, { color: '#8e44ad', angle: 200 },
          { color: '#2980b9', angle: 240 }, { color: '#7f8c8d', angle: 280 },
          { color: '#c0392b', angle: 320 },
        ].map(({ color, angle }, i) => {
          const rad = ((angle - 90) * Math.PI) / 180;
          const x = 240 + Math.cos(rad) * 155;
          const y = 240 + Math.sin(rad) * 155;
          return (
            <circle key={i} cx={x} cy={y} r="6" fill={color} opacity="0.8"
              filter="url(#glow)" style={{ animation: `twinkle ${1.5 + i * 0.3}s ease-in-out infinite` }}/>
          );
        })}

        {/* Center OM */}
        <text
          x="240" y="248"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="56"
          fill="rgba(250,199,117,0.9)"
          fontFamily="'Noto Sans Devanagari', sans-serif"
          filter="url(#goldGlow)"
          style={{ animation: 'pulse-om 3s ease-in-out infinite' }}
        >
          ॐ
        </text>
      </svg>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function LandingPage() {
  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '0 80px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 60,
          alignItems: 'center',
          width: '100%',
          maxWidth: 1280,
          margin: '0 auto',
        }}>
          {/* Left — content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <span className="pill" style={{ marginBottom: 24, display: 'inline-flex' }}>
                ✦ Vedic Shastra Aadhaarit
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="display-hero"
              style={{ marginBottom: 16 }}
            >
              Apna Bhagya<br />Jaaniye
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="display-italic"
              style={{ marginBottom: 20 }}
            >
              Asli kundli. Asli jawab. 24 ghante.
            </motion.p>

            <motion.p
              variants={itemVariants}
              style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 440, marginBottom: 32 }}
            >
              Parashari Jyotish se nirmit aapki janam kundli. Graha sthiti, Vimshottari Dasha,
              aur personalized AI Pandit — sirf aapke liye.
            </motion.p>

            <motion.div variants={itemVariants} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link href="/kundli" className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
                Free Kundli Banayein ✦
              </Link>
              <Link href="/rashifal" className="btn-ghost" style={{ padding: '14px 32px', fontSize: 16 }}>
                Aaj Ka Rashifal
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {['#e67e22', '#8e44ad', '#27ae60', '#2980b9', '#c0392b'].map((c, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: c,
                    border: '2px solid var(--bg-1)',
                    marginLeft: i > 0 ? -10 : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', fontWeight: 600,
                  }}>
                    {['R', 'P', 'A', 'S', 'V'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ color: '#f39c12', fontSize: 12 }}>★★★★★</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  50,000+ users ne apni kundli banaayi
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — mandala */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ filter: 'drop-shadow(0 0 40px rgba(186,117,23,0.3))' }}>
              <Mandala />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{
        borderTop: '1px solid var(--gold-border)',
        borderBottom: '1px solid var(--gold-border)',
        padding: '32px 80px',
        background: 'rgba(19,8,42,0.6)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          maxWidth: 1280,
          margin: '0 auto',
          textAlign: 'center',
        }}>
          {STATS.map(({ num, label }) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 40, fontWeight: 600,
                color: 'var(--gold-bright)',
                marginBottom: 4,
              }}>
                {num}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{ padding: '96px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <span className="pill" style={{ marginBottom: 16 }}>✦ Features</span>
          <h2>Kya milega aapko?</h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              className="gold-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--gold-bright)' }}>{icon}</div>
              <h4 style={{ marginBottom: 8 }}>{title}</h4>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ 12 RASHIS PREVIEW ═══ */}
      <section style={{
        padding: '80px',
        background: 'rgba(19,8,42,0.4)',
        borderTop: '1px solid var(--gold-border)',
        borderBottom: '1px solid var(--gold-border)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ marginBottom: 8 }}>12 Rashiyan</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)' }}>Apni rashi chuniye aur aaj ka rashifal dekhiye</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {RASHIS.map((rashi, i) => (
              <motion.div
                key={rashi}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, borderColor: 'var(--gold-mid)' }}
              >
                <Link
                  href={`/rashifal?rashi=${rashi.toLowerCase()}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="gold-card" style={{
                    textAlign: 'center',
                    padding: '16px 8px',
                    cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{RASHI_SYMBOLS[i]}</div>
                    <p style={{
                      fontFamily: 'var(--font-devanagari)',
                      fontSize: 14, color: 'var(--gold-bright)',
                      marginBottom: 2,
                    }}>
                      {RASHIS_DEVANAGARI[i]}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{rashi}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section style={{ padding: '96px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h2>Log kya kehte hain?</h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map(({ name, city, quote }, i) => (
            <motion.div
              key={name}
              className="gold-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div style={{ color: '#f39c12', marginBottom: 12, fontSize: 16 }}>★★★★★</div>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                "{quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--gold-mid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#08020f',
                }}>
                  {name[0]}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section style={{
        padding: '80px',
        background: 'var(--bg-0)',
        borderTop: '1px solid var(--gold-border)',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="devanagari" style={{
            fontSize: 32, color: 'var(--gold-bright)',
            display: 'block', marginBottom: 16,
          }}>ॐ</span>
          <h2 style={{ marginBottom: 12 }}>Ready to Discover Your Path?</h2>
          <p style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Thousands of seekers have found clarity through precise Vedic astrology. Aapki baar hai.
          </p>
          <Link href="/kundli" className="btn-primary" style={{ padding: '16px 48px', fontSize: 17 }}>
            Create Free Kundli Now ✦
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
