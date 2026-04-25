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
  const [magicSent, setMagicSent] = useState(false);
  const [usePassword, setUsePassword] = useState(false);

  const handleMagicLink = async () => {
    if (!email.trim()) { toast.error('Email daalo'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setMagicSent(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Swagat hai! ✦');
    router.push(data.user ? `/dashboard/${data.user.id}` : '/kundli');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Apna naam daalo'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Account ban gaya! Email verify karein.');
    setMagicSent(true);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span className="devanagari" style={{ fontSize: 40, color: 'var(--gold-bright)', display: 'block', marginBottom: 12 }}>ॐ</span>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>
            {tab === 'login' ? 'Dobara Swagat' : 'Shubh Aarambh'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
            {tab === 'login' ? 'Aapki kundli tayyar hai' : 'Apni pehli kundli banayein'}
          </p>
        </div>

        <div className="gold-card" style={{ padding: 32 }}>
          {/* Tab switch */}
          <div className="tab-bar" style={{ marginBottom: 28 }}>
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                className={`tab-item${tab === t ? ' active' : ''}`}
                onClick={() => { setTab(t); setMagicSent(false); }}
                style={{ flex: 1, position: 'relative' }}
              >
                {tab === t && (
                  <motion.div
                    layoutId="auth-tab"
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'var(--gold-mid)',
                      borderRadius: 8,
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {t === 'login' ? 'Login' : 'Sign Up'}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {magicSent ? (
              <motion.div
                key="magic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Email check karein!</h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
                  <strong style={{ color: 'var(--gold-bright)' }}>{email}</strong> pe link bheja gaya hai.
                  Woh link click karein aur login ho jayein.
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  className="btn-ghost"
                  style={{ marginTop: 20, fontSize: 13 }}
                >
                  Dobara bhejo
                </button>
              </motion.div>
            ) : (
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Magic link (default) */}
                {!usePassword ? (
                  <div>
                    {tab === 'signup' && (
                      <div style={{ marginBottom: 16 }}>
                        <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>Aapka Naam</label>
                        <input
                          className="input-gold"
                          placeholder="Rahul Sharma"
                          value={name}
                          onChange={e => setName(e.target.value)}
                        />
                      </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                      <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>Email</label>
                      <input
                        className="input-gold"
                        type="email"
                        placeholder="aap@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                      />
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '13px', marginBottom: 16 }}
                      onClick={handleMagicLink}
                      disabled={loading}
                    >
                      {loading ? 'Bhej rahe hain...' : 'Magic Link Bhejo ✦'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                      Password nahi chahiye — ek click se login
                    </p>
                    <button
                      onClick={() => setUsePassword(true)}
                      style={{
                        display: 'block', width: '100%', marginTop: 12,
                        background: 'none', border: 'none',
                        color: 'var(--text-3)', cursor: 'pointer',
                        fontSize: 12, textAlign: 'center',
                        textDecoration: 'underline',
                      }}
                    >
                      Password se login karein
                    </button>
                  </div>
                ) : (
                  /* Password form */
                  <form onSubmit={tab === 'login' ? handleLogin : handleSignup}>
                    {tab === 'signup' && (
                      <div style={{ marginBottom: 16 }}>
                        <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>Naam</label>
                        <input className="input-gold" placeholder="Rahul Sharma" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                      <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>Email</label>
                      <input className="input-gold" type="email" placeholder="aap@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label className="label-caps" style={{ display: 'block', marginBottom: 8 }}>Password</label>
                      <input className="input-gold" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
                      {loading ? 'Ho raha hai...' : tab === 'login' ? 'Login Karein' : 'Account Banayein'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsePassword(false)}
                      style={{
                        display: 'block', width: '100%', marginTop: 12,
                        background: 'none', border: 'none',
                        color: 'var(--text-3)', cursor: 'pointer',
                        fontSize: 12, textAlign: 'center',
                        textDecoration: 'underline',
                      }}
                    >
                      ← Magic Link se try karein
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 20 }}>
          Login karke aap hamare{' '}
          <a href="/privacy" style={{ color: 'var(--gold-mid)' }}>Privacy Policy</a>{' '}
          se sahmat hote hain.
        </p>
      </motion.div>
    </div>
  );
}
