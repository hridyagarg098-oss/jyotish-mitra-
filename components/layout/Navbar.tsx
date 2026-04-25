'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/kundli', label: 'Kundli' },
  { href: '/rashifal', label: 'Rashifal' },
  { href: '/milan', label: 'Milan' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--gold-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(8, 2, 15, 0.75)',
      }}
    >
      <div className="container-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontSize: 20, color: 'var(--gold-bright)' }}>☽</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--gold-bright)',
            letterSpacing: '0.5px',
          }}>
            Jyotish Mitra
          </span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 500,
                color: pathname === href ? 'var(--gold-bright)' : 'var(--text-2)',
                textDecoration: 'none',
                transition: 'color 0.2s',
                position: 'relative',
              }}
            >
              {label}
              {pathname === href && (
                <motion.span
                  layoutId="nav-underline"
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'var(--gold-mid)',
                    borderRadius: 1,
                  }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/auth" className="btn-ghost hidden md:inline-flex" style={{ padding: '8px 20px', fontSize: 13 }}>
            Login
          </Link>
          <Link href="/kundli" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
            Apni Kundli Banayein ✦
          </Link>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--text-1)', cursor: 'pointer', padding: 4 }}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              borderTop: '1px solid var(--gold-border)',
              background: 'rgba(13, 6, 24, 0.97)',
            }}
          >
            <div className="container-main" style={{ paddingTop: 16, paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    color: pathname === href ? 'var(--gold-bright)' : 'var(--text-2)',
                    textDecoration: 'none',
                    fontSize: 15,
                    fontWeight: 500,
                    padding: '8px 0',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
