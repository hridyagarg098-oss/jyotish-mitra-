'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function MilanPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleStart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data: kundli } = await supabase
      .from('kundlis')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!kundli) { router.push('/kundli'); return; }
    router.push(`/dashboard/${user.id}?tab=milan`);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 60 }}
      >
        <span className="pill" style={{ marginBottom: 16, display: 'inline-flex' }}>
          ♥ Kundli Milan
        </span>
        <h1 style={{ marginBottom: 16 }}>Ashtakoot Milan</h1>
        <p style={{ fontSize: 17, color: 'var(--text-2)', maxWidth: 560, margin: '0 auto' }}>
          Vivah se pehle kundli milan zaroori hai. Hamare Vedic shastra aadhaarit 36-guna system
          se apna aur partner ka milan karein.
        </p>
      </motion.div>

      {/* 8 Koots explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 60 }}>
        {[
          { name: 'Varna', max: 1, desc: 'Spiritual compatibility' },
          { name: 'Vashya', max: 2, desc: 'Power & control' },
          { name: 'Tara', max: 3, desc: 'Destiny alignment' },
          { name: 'Yoni', max: 4, desc: 'Physical compatibility' },
          { name: 'Graha Maitri', max: 5, desc: 'Mental compatibility' },
          { name: 'Gana', max: 6, desc: 'Nature & temperament' },
          { name: 'Bhakoot', max: 7, desc: 'Love & prosperity' },
          { name: 'Nadi', max: 8, desc: 'Health & progeny ⭐' },
        ].map(({ name, max, desc }, i) => (
          <motion.div
            key={name}
            className="gold-card"
            style={{ textAlign: 'center', padding: '20px 16px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, fontWeight: 600,
              color: 'var(--gold-bright)',
              marginBottom: 4,
            }}>
              {max}
            </div>
            <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Score chart */}
      <div className="gold-card" style={{ marginBottom: 40, padding: '28px 36px' }}>
        <p className="label-caps" style={{ marginBottom: 20 }}>Guna Milan Score Guide</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { range: '30–36', label: 'Shreshtha (Excellent)', color: '#27ae60', desc: 'Ideal match — strongly recommended' },
            { range: '24–29', label: 'Uttam (Good)', color: '#FAC775', desc: 'Good match — recommended' },
            { range: '18–23', label: 'Theek Hai (Average)', color: '#f39c12', desc: 'Average — proceed with caution' },
            { range: '0–17', label: 'Anushansit Nahin', color: '#c0392b', desc: 'Not recommended' },
          ].map(({ range, label, color, desc }) => (
            <div key={range} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 16px',
              background: 'var(--bg-3)',
              borderRadius: 10,
              borderLeft: `4px solid ${color}`,
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20, fontWeight: 600, color, minWidth: 56,
              }}>
                {range}
              </span>
              <div>
                <p style={{ fontWeight: 600, color, fontSize: 14 }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleStart}
          className="btn-primary"
          style={{ padding: '16px 48px', fontSize: 17, marginBottom: 12 }}
        >
          Apna Milan Shuru Karein ✦
        </button>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
          Pehle apni kundli banani hogi ·{' '}
          <Link href="/kundli" style={{ color: 'var(--gold-mid)' }}>Yahan banayein</Link>
        </p>
      </div>
    </div>
  );
}
