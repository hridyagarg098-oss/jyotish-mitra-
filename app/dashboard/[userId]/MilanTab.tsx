'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KundliData } from '@/lib/astro/kundliEngine';
import type { MilanResult } from '@/lib/astro/gunaCalculator';

export default function MilanTab({ kundli, userId }: { kundli: KundliData; userId: string }) {
  const [form, setForm] = useState({ name: '', dob: '', tob: '', pob: '' });
  const [result, setResult] = useState<MilanResult & {
    partnerKundli?: any;
    narrative?: string;
    nadiDosha?: boolean;
    bhakutDosha?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMilan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/milan/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerName: form.name, partnerDob: form.dob,
          partnerTob: form.tob, partnerPob: form.pob,
          partnerLat: 28.6139, partnerLng: 77.2090,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const GUNA_LABELS: Record<string, string> = {
    varna: 'Varna', vashya: 'Vashya', tara: 'Tara', yoni: 'Yoni',
    grahaMaitri: 'Graha Maitri', gana: 'Gana', bhakoot: 'Bhakoot', nadi: 'Nadi',
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Kundli Milan</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
          Ashtakoot Milan — 36 gunas ka parichay karein
        </p>
      </div>

      {!result ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Your summary */}
          <div className="gold-card">
            <p className="label-caps" style={{ marginBottom: 12 }}>Aapki Kundli</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gold-bright)', marginBottom: 4 }}>{kundli.name}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Rashi: {kundli.rashi}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Nakshatra: {kundli.nakshatra}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Lagna: {kundli.lagna}</p>
          </div>

          {/* Partner form */}
          <div className="gold-card">
            <p className="label-caps" style={{ marginBottom: 16 }}>Partner Ki Kundli</p>
            <form onSubmit={handleMilan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input-gold" placeholder="Partner ka naam" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input className="input-gold" type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} required style={{ colorScheme: 'dark' }} />
              <input className="input-gold" type="time" value={form.tob} onChange={e => setForm(f => ({ ...f, tob: e.target.value }))} required style={{ colorScheme: 'dark' }} />
              <input className="input-gold" placeholder="Janam sthan (city)" value={form.pob} onChange={e => setForm(f => ({ ...f, pob: e.target.value }))} required />
              {error && <p style={{ fontSize: 12, color: 'var(--red-planet)' }}>{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Milan ho raha hai...' : 'Milan Karein ✦'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Score display */}
            <div className="gold-card" style={{ textAlign: 'center', marginBottom: 24, background: 'var(--gold-dim)' }}>
              {/* Nadi Dosha warning */}
              {(result.nadiDosha || result.gunaBreakdown.nadiDosha) && (
                <div style={{
                  marginBottom: 12, padding: '12px 16px',
                  background: 'rgba(192,57,43,0.15)',
                  border: '1px solid rgba(192,57,43,0.5)',
                  borderRadius: 10, color: '#e74c3c', fontSize: 14, textAlign: 'left',
                }}>
                  ⚠️ <strong>Nadi Dosha!</strong> — Dono ka nakshatra ek hi nadi mein hai. Yeh sabse gambhir dosha hai — santaan aur swasthya par asar ho sakta hai. Upay zaroori hain.
                </div>
              )}
              {/* Bhakoot Dosha warning */}
              {result.bhakutDosha && (
                <div style={{
                  marginBottom: 12, padding: '12px 16px',
                  background: 'rgba(230,126,34,0.15)',
                  border: '1px solid rgba(230,126,34,0.5)',
                  borderRadius: 10, color: '#e67e22', fontSize: 14, textAlign: 'left',
                }}>
                  ⚠️ <strong>Bhakoot Dosha!</strong> — Rashiyon ki sthiti anukool nahi. Love aur prosperity par prabhav pad sakta hai — Rudrabhishek aur Vishnu Sahasranaam se upay karo.
                </div>
              )}
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 72, fontWeight: 600,
                color: result.verdictColor,
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {result.totalGunas}
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 12 }}>out of 36 gunas</div>
              <span style={{
                display: 'inline-block',
                padding: '6px 20px', borderRadius: 999,
                background: result.verdictColor + '22',
                border: `1px solid ${result.verdictColor}`,
                color: result.verdictColor,
                fontSize: 14, fontWeight: 600,
              }}>
                {result.verdict}
              </span>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 12 }}>
                {result.verdictHinglish}
              </p>
            </div>

            {/* Guna breakdown table */}
            <div className="gold-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gold-border)' }}>
                <p className="label-caps">Ashtakoot Breakdown</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(GUNA_LABELS).map(([key, label]) => {
                    const guna = result.gunaBreakdown[key as keyof typeof result.gunaBreakdown] as any;
                    if (!guna || typeof guna !== 'object') return null;
                    const pct = (guna.score / guna.max) * 100;
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid var(--gold-border)' }}>
                        <td style={{ padding: '12px 16px', width: 120 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{label}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>max {guna.max}</p>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.2, duration: 0.6 }}
                              style={{
                                height: '100%', borderRadius: 3,
                                background: pct >= 66 ? '#27ae60' : pct >= 33 ? 'var(--gold-mid)' : '#c0392b',
                              }}
                            />
                          </div>
                          {guna.description && (
                            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                              {guna.description}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', width: 60 }}>
                          <span style={{
                            fontSize: 14, fontWeight: 700,
                            color: pct === 0 ? '#c0392b' : pct < 50 ? '#e67e22' : 'var(--gold-bright)',
                          }}>
                            {guna.score}/{guna.max}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Partner kundli summary */}
            {result.partnerKundli && (
              <div className="gold-card" style={{ marginBottom: 16, padding: '16px 20px' }}>
                <p className="label-caps" style={{ marginBottom: 10 }}>Partner Ki Kundli</p>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div><p style={{ fontSize: 11, color: 'var(--text-3)' }}>Rashi</p><p style={{ fontSize: 14, fontWeight: 600 }}>{result.partnerKundli.rashi}</p></div>
                  <div><p style={{ fontSize: 11, color: 'var(--text-3)' }}>Lagna</p><p style={{ fontSize: 14, fontWeight: 600 }}>{result.partnerKundli.lagna}</p></div>
                  <div><p style={{ fontSize: 11, color: 'var(--text-3)' }}>Nakshatra</p><p style={{ fontSize: 14, fontWeight: 600 }}>{result.partnerKundli.nakshatra} Pada {result.partnerKundli.nakshatraPada}</p></div>
                  <div><p style={{ fontSize: 11, color: 'var(--text-3)' }}>Active Dasha</p><p style={{ fontSize: 14, fontWeight: 600 }}>{result.partnerKundli.currentDasha?.lord}</p></div>
                </div>
              </div>
            )}

            {/* AI Pandit Narrative */}
            {result.narrative && (
              <div className="gold-card" style={{
                marginBottom: 20,
                borderLeft: '3px solid var(--gold-mid)',
                padding: '20px 24px',
                background: 'linear-gradient(135deg, var(--gold-dim) 0%, var(--bg-2) 100%)',
              }}>
                <p className="label-caps" style={{ marginBottom: 12, color: 'var(--gold-bright)' }}>
                  👑 Pandit Ji Ki Raay
                </p>
                <p style={{
                  fontSize: 15, color: 'var(--text-1)',
                  lineHeight: 1.75, whiteSpace: 'pre-wrap',
                  fontStyle: 'italic',
                }}>
                  {result.narrative}
                </p>
              </div>
            )}

            <button onClick={() => setResult(null)} className="btn-ghost" style={{ fontSize: 13 }}>
              ← Dobara try karein
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
