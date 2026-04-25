'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/',         label: 'Home',     icon: '🏠' },
  { href: '/kundli',   label: 'Kundli',   icon: '☽' },
  { href: '/rashifal', label: 'Rashifal', icon: '☉' },
  { href: '/milan',    label: 'Milan',    icon: '♥' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav">
      {ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '8px 4px', position: 'relative',
              color: active ? 'var(--gold-bright)' : 'var(--text-3)',
              transition: 'color 0.2s',
            }}>
              {active && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28, height: 2,
                  background: 'var(--gold-bright)',
                  borderRadius: '0 0 3px 3px',
                }} />
              )}
              <span style={{
                fontSize: 20, lineHeight: 1,
                filter: active ? 'drop-shadow(0 0 6px rgba(250,199,117,0.6))' : 'none',
                transition: 'filter 0.2s',
              }}>{icon}</span>
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                letterSpacing: '0.3px',
                fontFamily: 'var(--font-body)',
              }}>{label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
