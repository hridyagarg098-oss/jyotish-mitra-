import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import StarField from '@/components/layout/StarField';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatPanel from '@/components/chat/ChatPanel';
import { Toaster } from 'sonner';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const viewport = {
  themeColor: '#08020f',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Jyotish Mitra — Vedic Astrology AI | Kundli, Rashifal, Milan',
  description: 'Apni janma kundli banayein aur AI Pandit se baat karein. Vedic Shastra aadhaarit sahi jyotish — bilkul free. Rashifal, Kundli Milan, Dasha Vichar aur bahut kuch.',
  keywords: 'kundli, jyotish, vedic astrology, rashifal, kundli milan, hindi horoscope, free kundli, AI astrology India',
  openGraph: {
    title: 'Jyotish Mitra — Apna Bhagya Jaaniye',
    description: 'Asli kundli. Asli jawab. 24 ghante. AI-powered Vedic astrology for India.',
    type: 'website',
    locale: 'hi_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="hi"
      className={`${cormorant.variable} ${dmSans.variable} ${notoDevanagari.variable}`}
      style={{ background: 'var(--bg-1)' }}
    >
      <body style={{ position: 'relative', minHeight: '100vh' }}>
        {/* Fullscreen starfield — z-index 0, behind everything */}
        <StarField />

        {/* Navbar — z-index 50 */}
        <Navbar />

        {/* Main content — z-index 1 */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <main style={{ minHeight: 'calc(100vh - 64px)', paddingTop: 64 }}>
            {children}
          </main>
          <Footer />
        </div>

        {/* Floating AI Pandit Chat — z-index 100 */}
        <ChatPanel />

        {/* Toast notifications */}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--bg-2)',
              border: '1px solid var(--gold-border-strong)',
              color: 'var(--text-1)',
              fontFamily: 'var(--font-body)',
            },
          }}
        />
      </body>
    </html>
  );
}
