'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // UI states
  const [magicSent, setMagicSent] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false); // email not confirmed
  const [mode, setMode] = useState<'magic' | 'password'>('password'); // default to password

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

  // ── Magic Link ──────────────────────────────────────────
  const handleMagicLink = async () => {
    if (!email.trim()) { toast.error('Email daalo'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setMagicSent(true);
    toast.success('Magic link bhej diya! Email check karein.');
  };

  // ── Password Login ──────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email aur password dono daalo');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      // Email not confirmed — show resend UI
      if (
        error.message.toLowerCase().includes('email not confirmed') ||
        error.message.toLowerCase().includes('not confirmed')
      ) {
        setVerifyPending(true);
        return;
      }
      // Invalid credentials
      if (
        error.message.toLowerCase().includes('invalid login') ||
        error.message.toLowerCase().includes('invalid credentials')
      ) {
        toast.error('Email ya password galat hai');
        return;
      }
      toast.error(error.message);
      return;
    }

    toast.success('Swagat hai! ✦');
    router.push(data.user ? `/dashboard/${data.user.id}` : '/kundli');
  };

  // ── Password Signup ─────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Apna naam daalo'); return; }
    if (!email.trim()) { toast.error('Email daalo'); return; }
    if (password.length < 6) { toast.error('Password kam se kam 6 characters ka hona chahiye'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already exists')) {
        toast.error('Yeh email pehle se registered hai — login karein');
        setTab('login');
        return;
      }
      toast.error(error.message);
      return;
    }

    setVerifyPending(true);
  };

  // ── Resend confirmation ─────────────────────────────────
  const handleResend = async () => {
    if (!email.trim()) { toast.error('Email daalo'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Confirmation email dobara bhej diya!');
  };

  // ── Verify-pending screen ───────────────────────────────
  if (verifyPending) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440 }}>
          <div className="gold-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontSize: 26, marginBottom: 12 }}>Email Verify Karein</h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 8 }}>
              <strong style={{ color: 'var(--gold-bright)' }}>{email}</strong> pe ek confirmation link bheja gaya hai.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>
              Link click karein → aap automatically login ho jayenge aur apni kundli bana sakte hain.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handleResend}
                className="btn-primary"
                disabled={loading}
                style={{ padding: '13px', fontSize: 14 }}
              >
                {loading ? 'Bhej rahe hain...' : '↻ Dobara Email Bhejo'}
              </button>
              <button
                onClick={() => { setVerifyPending(false); setTab('login'); setMode('password'); }}
                className="btn-ghost"
                style={{ padding: '12px', fontSize: 13 }}
              >
                ← Login Page Par Wapas Jao
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 24 }}>
              Spam folder bhi check karein. Link 24 ghante valid rehta hai.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Magic-link sent screen ──────────────────────────────
  if (magicSent) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440 }}>
          <div className="gold-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
            <h2 style={{ fontSize: 24, marginBottom: 10 }}>Magic Link Bheja!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>
              <strong style={{ color: 'var(--gold-bright)' }}>{email}</strong> pe link bheja gaya hai.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>
              Email mein link click karein — koi password nahi chahiye.
            </p>
            <button onClick={() => setMagicSent(false)} className="btn-ghost" style={{ padding: '12px 24px' }}>
              ← Wapas Jao
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main auth form ──────────────────────────────────────
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="devanagari" style={{ fontSize: 40, color: 'var(--gold-bright)', display: 'block', marginBottom: 10 }}>ॐ</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>
            {tab === 'login' ? 'Dobara Swagat' : 'Shubh Aarambh'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
            {tab === 'login' ? 'Aapki kundli tayyar hai' : 'Apni pehli kundli banayein'}
          </p>
        </div>

        <div className="gold-card" style={{ padding: 28 }}>
          {/* Tab switch */}
          <div className="tab-bar" style={{ marginBottom: 24 }}>
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                className={`tab-item${tab === t ? ' active' : ''}`}
                onClick={() => { setTab(t); setVerifyPending(false); }}
                style={{ flex: 1, position: 'relative' }}
              >
                {tab === t && (
                  <motion.div
                    layoutId="auth-tab"
                    style={{ position: 'absolute', inset: 0, background: 'var(--gold-mid)', borderRadius: 8 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{t === 'login' ? 'Login' : 'Sign Up'}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

              {/* ── LOGIN ── */}
              {tab === 'login' && (
                <div>
                  {/* Mode toggle */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {(['password', 'magic'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                          flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                          fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
                          background: mode === m ? 'var(--gold-dim)' : 'transparent',
                          border: `1px solid ${mode === m ? 'var(--gold-border-strong)' : 'var(--gold-border)'}`,
                          color: mode === m ? 'var(--gold-bright)' : 'var(--text-3)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {m === 'password' ? '🔑 Password' : '✨ Magic Link'}
                      </button>
                    ))}
                  </div>

                  {mode === 'password' ? (
                    <form onSubmit={handleLogin}>
                      <div style={{ marginBottom: 14 }}>
                        <label className="label-caps" style={{ display: 'block', marginBottom: 6 }}>Email</label>
                        <input className="input-gold" type="email" placeholder="aap@example.com"
                          value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <label className="label-caps" style={{ display: 'block', marginBottom: 6 }}>Password</label>
                        <input className="input-gold" type="password" placeholder="••••••••"
                          value={password} onChange={e => setPassword(e.target.value)} required />
                      </div>
                      <button type="submit" className="btn-primary"
                        style={{ width: '100%', padding: '13px', fontSize: 15 }} disabled={loading}>
                        {loading ? 'Login ho raha hai...' : 'Login Karein →'}
                      </button>
                    </form>
                  ) : (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <label className="label-caps" style={{ display: 'block', marginBottom: 6 }}>Email</label>
                        <input className="input-gold" type="email" placeholder="aap@example.com"
                          value={email} onChange={e => setEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleMagicLink()} />
                      </div>
                      <button onClick={handleMagicLink} className="btn-primary"
                        style={{ width: '100%', padding: '13px', fontSize: 15 }} disabled={loading}>
                        {loading ? 'Bhej rahe hain...' : 'Magic Link Bhejo ✨'}
                      </button>
                      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>
                        Email pe ek link aayega — click karke seedha login
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── SIGNUP ── */}
              {tab === 'signup' && (
                <form onSubmit={handleSignup}>
                  <div style={{ marginBottom: 14 }}>
                    <label className="label-caps" style={{ display: 'block', marginBottom: 6 }}>Aapka Naam</label>
                    <input className="input-gold" placeholder="Rahul Sharma"
                      value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="label-caps" style={{ display: 'block', marginBottom: 6 }}>Email</label>
                    <input className="input-gold" type="email" placeholder="aap@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label className="label-caps" style={{ display: 'block', marginBottom: 6 }}>Password</label>
                    <input className="input-gold" type="password" placeholder="Kam se kam 6 characters"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary"
                    style={{ width: '100%', padding: '13px', fontSize: 15 }} disabled={loading}>
                    {loading ? 'Account ban raha hai...' : 'Account Banayein ✦'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
                    Email confirmation aayega — usse verify karke login karein
                  </p>
                </form>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 20 }}>
          Login karke aap hamare{' '}
          <a href="/privacy" style={{ color: 'var(--gold-mid)' }}>Privacy Policy</a> se sahmat hote hain.
        </p>
      </motion.div>
    </div>
  );
}
