'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const INTERESTS = ['Career', 'Vivah', 'Swasthya', 'Paisa', 'Shiksha', 'Grih'];
const GENDERS = ['Purush', 'Mahila', 'Anya'];

const LOADING_MESSAGES = [
  'Graha sthiti nirdharit ho rahi hai...',
  'Lagna aur Nakshatra calculate ho raha hai...',
  'Dasha aur Antardasha tayaar ho rahi hai...',
  'Aapki kundli tayaar hai! ✦',
];

const PLANETS_ANIM = [
  { name: 'सू', color: '#e67e22', orbit: 80, speed: 3 },
  { name: 'चं', color: '#bdc3c7', orbit: 100, speed: 2 },
  { name: 'मं', color: '#c0392b', orbit: 120, speed: 4 },
  { name: 'बु', color: '#27ae60', orbit: 95, speed: 5 },
  { name: 'गु', color: '#f39c12', orbit: 115, speed: 1.5 },
  { name: 'शु', color: '#8e44ad', orbit: 85, speed: 2.5 },
  { name: 'श',  color: '#2980b9', orbit: 130, speed: 1 },
];

export default function KundliPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<'form' | 'loading' | 'done'>('form');
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [gender, setGender] = useState<string>('');
  const [form, setForm] = useState({
    name: '', dob: '', tob: '', pob: '',
    lat: 28.6139, lng: 77.2090, // Default: Delhi
  });

  const toggleInterest = (i: string) =>
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check auth — redirect to login if not signed in
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      toast.error('Pehle login karein');
      router.push('/auth');
      return;
    }

    setStep('loading');

    // Cycle loading messages
    const msgInterval = setInterval(() => {
      setLoadingMsg(prev => {
        if (prev >= LOADING_MESSAGES.length - 1) { clearInterval(msgInterval); return prev; }
        return prev + 1;
      });
    }, 900);

    try {
      const res = await fetch('/api/kundli/calculate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          dob: form.dob,
          tob: form.tob,
          pob: form.pob,
          lat: form.lat,
          lng: form.lng,
        }),
      });

      const data = await res.json();

      // Session expired — redirect to login
      if (res.status === 401) {
        clearInterval(msgInterval);
        setStep('form');
        toast.error('Session expire ho gayi — dobara login karein');
        router.push('/auth');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      // Store calculated data in sessionStorage so dashboard can show it
      // even if DB save failed (tables not set up yet)
      try {
        sessionStorage.setItem('latestKundli', JSON.stringify(data));
      } catch (_) {}

      setStep('done');
      await new Promise(r => setTimeout(r, 1000));

      // Always redirect to dashboard — it reads from DB or sessionStorage
      router.push(`/dashboard/${user.id}`);
    } catch (err) {
      clearInterval(msgInterval);
      setStep('form');
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Kundli nahi ban payi', { description: msg });
    }
  };

  // Simple city search (without Google Places — manual input)
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, pob: e.target.value }));
    // In future: integrate Google Places for lat/lng
    // For now: hardcoded major city coordinates
    const city = e.target.value.toLowerCase();
    if (city.includes('mumbai') || city.includes('bombay')) setForm(f => ({ ...f, lat: 19.0760, lng: 72.8777 }));
    else if (city.includes('delhi') || city.includes('new delhi')) setForm(f => ({ ...f, lat: 28.6139, lng: 77.2090 }));
    else if (city.includes('bangalore') || city.includes('bengaluru')) setForm(f => ({ ...f, lat: 12.9716, lng: 77.5946 }));
    else if (city.includes('chandigarh')) setForm(f => ({ ...f, lat: 30.7333, lng: 76.7794 }));
    else if (city.includes('kolkata')) setForm(f => ({ ...f, lat: 22.5726, lng: 88.3639 }));
    else if (city.includes('chennai')) setForm(f => ({ ...f, lat: 13.0827, lng: 80.2707 }));
    else if (city.includes('hyderabad')) setForm(f => ({ ...f, lat: 17.3850, lng: 78.4867 }));
    else if (city.includes('pune')) setForm(f => ({ ...f, lat: 18.5204, lng: 73.8567 }));
    else if (city.includes('jaipur')) setForm(f => ({ ...f, lat: 26.9124, lng: 75.7873 }));
    else if (city.includes('lucknow')) setForm(f => ({ ...f, lat: 26.8467, lng: 80.9462 }));
    else if (city.includes('ahmedabad')) setForm(f => ({ ...f, lat: 23.0225, lng: 72.5714 }));
    else if (city.includes('surat')) setForm(f => ({ ...f, lat: 21.1702, lng: 72.8311 }));
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      position: 'relative',
    }}>
      <AnimatePresence mode="wait">
        {step === 'loading' || step === 'done' ? (
          /* Loading Animation */
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', maxWidth: 400 }}
          >
            {/* Orbiting planets */}
            <div style={{
              position: 'relative',
              width: 280, height: 280,
              margin: '0 auto 32px',
            }}>
              {/* Center OM */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: 'var(--font-devanagari)',
                fontSize: 48,
                color: 'var(--gold-bright)',
                animation: 'pulse-om 2s ease-in-out infinite',
              }}>
                ॐ
              </div>

              {/* Planets */}
              {PLANETS_ANIM.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: 28, height: 28,
                    marginTop: -14, marginLeft: -14,
                    animation: `orbit ${p.speed}s linear infinite`,
                    ['--orbit-r' as any]: `${p.orbit / 2}px`,
                  }}
                >
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: p.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11,
                    fontFamily: 'var(--font-devanagari)',
                    color: '#fff',
                    fontWeight: 600,
                    boxShadow: `0 0 10px ${p.color}80`,
                    animation: `orbit ${p.speed}s linear infinite reverse`,
                  }}>
                    {p.name}
                  </div>
                </div>
              ))}
            </div>

            <motion.p
              key={loadingMsg}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                color: 'var(--gold-bright)',
                marginBottom: 24,
              }}
            >
              {step === 'done' ? 'Aapki kundli tayaar hai! ✦' : LOADING_MESSAGES[loadingMsg]}
            </motion.p>

            {/* Progress bar */}
            <div style={{
              width: '100%', height: 4, borderRadius: 2,
              background: 'var(--bg-3)',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: step === 'done' ? '100%' : `${((loadingMsg + 1) / LOADING_MESSAGES.length) * 100}%` }}
                transition={{ duration: 0.8 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--gold-mid), var(--gold-bright))',
                  borderRadius: 2,
                }}
              />
            </div>
          </motion.div>
        ) : (
          /* Birth Form */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ width: '100%', maxWidth: 620 }}
          >
            {/* Step indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 32,
            }}>
              {['Vivran', 'Ganana', 'Dashboard'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: i === 0 ? 'var(--gold-mid)' : 'var(--bg-3)',
                    border: i === 0 ? 'none' : '1px solid var(--gold-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600,
                    color: i === 0 ? '#08020f' : 'var(--text-3)',
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: i === 0 ? 'var(--gold-bright)' : 'var(--text-3)' }}>
                    {s}
                  </span>
                  {i < 2 && <div style={{ width: 32, height: 1, background: 'var(--gold-border)' }} />}
                </div>
              ))}
            </div>

            <div className="gold-card" style={{ padding: '36px 40px' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <span className="pill" style={{ marginBottom: 12 }}>✦ Vedic Shastra Aadhaarit</span>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 32, fontWeight: 600,
                  color: 'var(--gold-bright)',
                  margin: '8px 0 8px',
                }}>
                  Apni Kundli Banayein
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
                  Asli Vedic calculation — koi generic horoscope nahi
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div style={{ marginBottom: 20 }}>
                  <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>
                    Aapka Poora Naam
                  </label>
                  <input
                    className="input-gold"
                    type="text"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                {/* DOB + TOB */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>
                      Janm Tithi
                    </label>
                    <input
                      className="input-gold"
                      type="date"
                      value={form.dob}
                      onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                      required
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>
                      Janm Samay
                    </label>
                    <input
                      className="input-gold"
                      type="time"
                      value={form.tob}
                      onChange={e => setForm(f => ({ ...f, tob: e.target.value }))}
                      required
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Birth place */}
                <div style={{ marginBottom: 20 }}>
                  <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>
                    Janam Sthan
                  </label>
                  <input
                    className="input-gold"
                    type="text"
                    placeholder="Delhi, Mumbai, Chandigarh..."
                    value={form.pob}
                    onChange={handleCityChange}
                    required
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                    Major Indian cities auto-detected. Google Places coming soon.
                  </p>
                </div>

                {/* Interests */}
                <div style={{ marginBottom: 20 }}>
                  <label className="label-caps" style={{ display: 'block', marginBottom: 10 }}>
                    Aap kya jaanna chahte hain?
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {INTERESTS.map(i => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInterest(i)}
                        className={`pill pill-toggle${interests.includes(i) ? ' active' : ''}`}
                        style={{ fontSize: 13, padding: '6px 16px' }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div style={{ marginBottom: 32 }}>
                  <label className="label-caps" style={{ display: 'block', marginBottom: 10 }}>
                    Aapka Gender
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {GENDERS.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`pill pill-toggle${gender === g ? ' active' : ''}`}
                        style={{ fontSize: 13, padding: '6px 20px' }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 16 }}
                >
                  Meri Kundli Banao ✦
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
