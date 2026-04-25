import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Kundli', href: '/kundli' },
  { label: 'Rashifal', href: '/rashifal' },
  { label: 'Kundli Milan', href: '/milan' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--gold-border)',
      background: 'var(--bg-0)',
      padding: '48px 0 32px',
      position: 'relative',
      zIndex: 1,
    }}>
      <div className="container-main">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40,
          marginBottom: 40,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 18, color: 'var(--gold-bright)' }}>☽</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--gold-bright)',
              }}>Jyotish Mitra</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 260 }}>
              Vedic Shastra aadhaarit AI jyotish — asli kundli, asli jawab, 24 ghante.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="label-caps" style={{ marginBottom: 16 }}>Pages</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FOOTER_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: 13,
                    color: 'var(--text-2)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Credits */}
          <div>
            <p className="label-caps" style={{ marginBottom: 16 }}>Shastra</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>
              Parashari Jyotish • Lahiri Ayanamsa<br />
              Vimshottari Dasha • Ashtakoot Milan<br />
              <span className="devanagari" style={{ color: 'var(--gold-bright)', fontSize: 15 }}>
                ॐ नमः शिवाय
              </span>
            </p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--gold-border)',
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            © 2025 Jyotish Mitra. Celestial Wisdom, Modern Technology.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Built with ✦ for seekers of truth
          </p>
        </div>
      </div>
    </footer>
  );
}
