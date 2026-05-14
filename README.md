# ॐ Jyotish Mitra — AI-Powered Vedic Astrology Platform

> Asli Kundli. Asli Jawab. 24 Ghante.

Jyotish Mitra is a full-stack Vedic astrology web app built for the Indian audience. It generates accurate Janam Kundlis using Parashari Jyotish calculations (Lahiri Ayanamsa), provides daily Rashifal powered by real planetary transits, and features an AI Pandit chatbot that gives personalized astrological guidance in Hinglish — all for free.

**Live:** [jyotish-mitra.netlify.app](https://jyotish-mitra.netlify.app)

---

## Features

- **Janam Kundli Generator** — Enter birth details (date, time, place) and get a full Vedic chart with all 9 grahas, Lagna, Nakshatra, and house positions. Calculations use the VSOP87 ephemeris with Lahiri Ayanamsa.
- **Vimshottari Dasha** — Automatically calculates your current Mahadasha and Antardasha with exact start/end dates.
- **AI Pandit Chat** — A conversational Jyotish chatbot that reads your personal kundli and answers questions about career, marriage, health, etc. Speaks in Hinglish, gives specific timing (dasha + gochar based), and suggests remedies (mantras, gemstones, rituals).
- **Daily Rashifal** — Transit-based horoscope for all 12 rashis with career, love, health predictions + lucky color/number/time.
- **Kundli Milan (Ashtakoot)** — 36-guna matching with Nadi Dosha detection for marriage compatibility.
- **User Dashboard** — View your saved kundlis, chat history, and personalized insights.
- **Responsive UI** — Dark theme with gold accents, animated mandala, starfield background, and smooth Framer Motion transitions.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion |
| AI/LLM | Groq (LLaMA 3.3 70B) for chat + Rashifal generation |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Astro Engine | Custom VSOP87-based ephemeris (`astronomia` library), Lahiri Ayanamsa |
| Deployment | Netlify (with `@netlify/plugin-nextjs`) |
| Auth | Supabase Auth (email/password + magic link) |
| Fonts | Cormorant Garamond, DM Sans, Noto Sans Devanagari |

---

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page with mandala animation
│   ├── auth/page.tsx         # Login / Signup (password + magic link)
│   ├── kundli/page.tsx       # Birth details form → kundli calculation
│   ├── rashifal/page.tsx     # Daily horoscope for 12 rashis
│   ├── milan/page.tsx        # Kundli Milan (Ashtakoot guna matching)
│   ├── dashboard/[userId]/   # User dashboard with saved kundlis
│   └── api/
│       ├── chat/route.ts     # AI Pandit streaming chat (Groq)
│       ├── kundli/calculate/ # Kundli calculation endpoint
│       ├── rashifal/         # Daily rashifal with transit data
│       ├── milan/calculate/  # Guna Milan calculation
│       └── daily-transits/   # Planetary transit computation
├── components/
│   ├── chat/ChatPanel.tsx    # Floating AI Pandit chat widget
│   ├── layout/               # Navbar, Footer, StarField, MobileNav
│   ├── kundli/               # Kundli-specific components
│   └── ui/                   # Shared UI components
├── lib/
│   ├── ai/systemPrompt.ts   # AI Pandit persona + kundli context builder
│   ├── astro/                # Vedic astrology calculation engine
│   │   ├── kundliEngine.ts   # Main kundli calculator
│   │   ├── ephemerisEngine.ts# VSOP87 planetary positions
│   │   ├── lagna.ts          # Ascendant (Lagna) calculation
│   │   ├── gochar.ts         # Transit (Gochar) engine
│   │   ├── gunaCalculator.ts # Ashtakoot Milan (36 guna)
│   │   └── constants.ts      # Rashis, Nakshatras, planet data
│   ├── supabase/             # Supabase client (server + browser + admin)
│   └── ist-utils.ts          # IST timezone helpers
├── supabase/migrations/      # Database schema (run in Supabase SQL Editor)
├── prisma/schema.prisma      # Prisma config (PostgreSQL)
└── .github/workflows/        # CI/CD — auto-deploy to Netlify on push
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project (free tier works fine)
- A [Groq](https://console.groq.com) API key (free tier available)

### 1. Clone the repo

```bash
git clone https://github.com/hridyagarg098-oss/jyotish-mitra-.git
cd jyotish-mitra-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# AI (required — get from https://console.groq.com)
GROQ_API_KEY=your_groq_api_key

# Supabase (required — get from your Supabase project settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Jyotish Mitra
```

### 4. Set up the database

Go to your Supabase Dashboard → **SQL Editor**, and run the migration file:

```
supabase/migrations/001_init.sql
```

This creates all the tables (`users`, `kundlis`, `chat_messages`, `daily_rashifal`, `milan_results`), enables Row Level Security, and sets up triggers for auto user creation on signup.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page with the animated mandala.

---

## How It Works

### Kundli Calculation
The kundli engine uses VSOP87 planetary ephemeris (via the `astronomia` library) to compute the exact sidereal positions of all 9 Vedic grahas (Sun through Ketu). It applies the Lahiri Ayanamsa to convert tropical to sidereal coordinates, calculates the Lagna (ascendant) based on local sidereal time, determines house placements, and computes the full Vimshottari Dasha sequence from the Moon's Nakshatra at birth.

### AI Pandit
The AI Pandit is powered by Groq's LLaMA 3.3 70B model. It receives the user's complete kundli data (planet positions, dasha periods, transits) as structured context and responds in character as a 58-year-old Varanasi-trained jyotishi. Responses are capped at 180 tokens to keep answers concise and WhatsApp-like. The system prompt includes deep knowledge from classical texts like Brihat Parashara Hora Shastra, Phaladeepika, and Lal Kitab.

### Daily Rashifal
The rashifal system computes real planetary transits for today (IST), then sends the transit data along with the selected rashi to the AI model. Results are cached in Supabase so the same rashi doesn't get regenerated within the same day.

---

## Deployment

The project is set up for Netlify deployment with the `@netlify/plugin-nextjs` plugin. There's a GitHub Actions workflow (`.github/workflows/deploy.yml`) that auto-deploys on push to `master`.

To deploy manually:

```bash
npm run build
netlify deploy --prod
```

Make sure to set all environment variables in your Netlify dashboard → Site Settings → Environment Variables.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for AI chat and rashifal |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app's public URL |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Google Gemini API key (optional fallback) |
| `OPENAI_API_KEY` | No | OpenAI API key (optional fallback) |
| `EXA_API_KEY` | No | Exa AI search key |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | No | Razorpay key for future payments |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics |

---

## Known Limitations

- **City coordinates** — Currently supports ~12 major Indian cities for auto lat/lng detection. For other cities, coordinates default to Delhi. Google Places integration is planned.
- **Ephemeris precision** — VSOP87 is accurate for modern dates but may have minor deviations for historical dates (pre-1900).
- **Kundli Milan** — Only supports Ashtakoot (North Indian) system for now. Dashakoot (South Indian) is not yet implemented.

---

## Contributing

Contributions welcome! If you want to add a feature or fix something:

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR

---

## License

This project is for educational and personal use. If you plan to use it commercially, please reach out first.

---

Built with ☕ and a lot of Vedic Shastra research.
