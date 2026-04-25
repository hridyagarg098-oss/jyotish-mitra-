'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/kundli',   label: 'Kundli',      icon: '☽', desc: 'Janam Kundli Banayein' },
  { href: '/rashifal', label: 'Rashifal',    icon: '☉', desc: 'Aaj Ka Rashifal Dekhiye' },
  { href: '/milan',    label: 'Kundli Milan', icon: '♥', desc: 'Rishta Check Karein' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: '1px solid var(--gold-border)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(8,2,15,0.85)',
      }}>
        <div className="container-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ fontSize: 20, color: 'var(--gold-bright)' }}>☽</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--gold-bright)', letterSpacing: '0.5px' }}>
              Jyotish Mitra
            </span>
          </Link>

          {/* Desktop links */}
          <div className="nav-desktop-links">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} style={{
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                color: pathname === href ? 'var(--gold-bright)' : 'var(--text-2)',
                textDecoration: 'none', transition: 'color 0.2s', position: 'relative',
              }}>
                {label}
                {pathname === href && (
                  <motion.span layoutId="nav-underline" style={{
                    position: 'absolute', bottom: -4, left: 0, right: 0,
                    height: 1, background: 'var(--gold-mid)', borderRadius: 1,
                  }} />
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/auth" className="btn-ghost nav-desktop-only" style={{ padding: '8px 18px', fontSize: 13 }}>Login</Link>
            <Link href="/kundli" className="btn-primary nav-desktop-only" style={{ padding: '8px 18px', fontSize: 13 }}>Kundli Banayein ✦</Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="nav-mobile-only"
              aria-label="Open menu"
              style={{
                background: 'var(--gold-dim)', border: '1px solid var(--gold-border-strong)',
                color: 'var(--gold-bright)', cursor: 'pointer', padding: 8,
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Full-Screen Drawer ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 98,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
              }}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(340px, 92vw)', zIndex: 99,
                background: 'linear-gradient(160deg, #0d0618 0%, #13082a 60%, #1c1035 100%)',
                borderLeft: '1px solid var(--gold-border-strong)',
                display: 'flex', flexDirection: 'column', overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', borderBottom: '1px solid var(--gold-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, color: 'var(--gold-bright)' }}>☽</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold-bright)', fontWeight: 600 }}>
                    Jyotish Mitra
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'rgba(186,117,23,0.12)', border: '1px solid var(--gold-border)',
                    color: 'var(--gold-bright)', cursor: 'pointer', padding: 8,
                    borderRadius: 8, display: 'flex', alignItems: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Decorative OM */}
              <div style={{ textAlign: 'center', padding: '20px 0 4px' }}>
                <span className="devanagari" style={{ fontSize: 56, color: 'var(--gold-bright)', opacity: 0.12 }}>ॐ</span>
              </div>

              {/* Nav links */}
              <div style={{ padding: '8px 16px', flex: 1 }}>
                {NAV_LINKS.map(({ href, label, icon, desc }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 + 0.05 }}
                  >
                    <Link href={href} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 14, marginBottom: 8,
                        background: pathname === href ? 'rgba(186,117,23,0.12)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${pathname === href ? 'var(--gold-border-strong)' : 'rgba(255,255,255,0.05)'}`,
                        transition: 'all 0.2s',
                      }}>
                        <span style={{
                          fontSize: 22, width: 44, height: 44, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: pathname === href ? 'var(--gold-dim)' : 'var(--bg-3)',
                          borderRadius: 12, border: '1px solid var(--gold-border)',
                          color: pathname === href ? 'var(--gold-bright)' : 'var(--text-2)',
                        }}>{icon}</span>
                        <div>
                          <p style={{
                            fontSize: 16, fontWeight: 600, marginBottom: 2,
                            color: pathname === href ? 'var(--gold-bright)' : 'var(--text-1)',
                          }}>{label}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Footer CTAs */}
              <div style={{
                padding: '20px', borderTop: '1px solid var(--gold-border)',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <Link href="/kundli" className="btn-primary" onClick={() => setOpen(false)}
                  style={{ width: '100%', padding: '15px', fontSize: 15, justifyContent: 'center' }}>
                  Free Kundli Banayein ✦
                </Link>
                <Link href="/auth" className="btn-ghost" onClick={() => setOpen(false)}
                  style={{ width: '100%', padding: '13px', fontSize: 14, justifyContent: 'center' }}>
                  Login / Sign Up
                </Link>
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  <span className="devanagari">ॐ नमः शिवाय</span>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
