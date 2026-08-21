# MiLyfe Platform

**Your City. Your Life. Your Platform.**

A decentralized civic engagement platform connecting communities through mutual aid, health tracking, local commerce, governance, and safety — powered by $MLY community currency.

## What It Does

| App | Purpose |
|-----|---------|
| **MiCity** | Report infrastructure issues, upvote priorities, track resolution |
| **MiHealth** | Daily wellness check-ins with streak tracking |
| **MiShop** | Local marketplace — buy/sell with $MLY credits |
| **MiConnect** | Real-time community messaging |
| **MiVault** | Encrypted document storage with revocable sharing |
| **MiMap** | Interactive map of issues, events, and resources |
| **Governance** | Community proposals with voting and quorum tracking |
| **Jobs** | Local gigs marketplace with $MLY payments |
| **Mutual Aid** | Request/offer help, neighbor matching |
| **Resources** | Verified directory of free community services |
| **Safety** | Wellness check-ins, emergency contacts, anonymous tips |
| **Mi AI** | Community assistant powered by Groq LLM |

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **AI:** Groq API (llama-3.1-8b-instant) with local fallback
- **Maps:** Leaflet + OpenStreetMap
- **State:** Zustand
- **PWA:** Service worker + offline support
- **Deployment:** Vercel

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set up environment
cp .env.local.example .env.local
# Fill in your Supabase keys

# Run the database migration
npx supabase db push

# Start development
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UBI_CRON_SECRET=your_secret
GROQ_API_KEY=your_groq_key (optional, falls back to local)
```

## $MLY Currency

Earn $MLY through community participation:
- Daily health check-in: +5 MLY
- Report city issue: +10 MLY
- Daily UBI (active users): +10 MLY
- Vote on proposal: +3 MLY
- Offer mutual aid: +15 MLY
- Safety check-in: +2 MLY

Spend at local vendors on MiShop or transfer to neighbors.

## Architecture

```
src/
├── app/
│   ├── (auth)/          # Login, signup
│   ├── (platform)/      # All authenticated apps
│   │   ├── home/        # Dashboard + community feed
│   │   ├── city/        # Issue reporting + tracking
│   │   ├── health/      # Wellness check-ins
│   │   ├── shop/        # Local marketplace
│   │   ├── connect/     # Messaging
│   │   ├── vault/       # Document storage
│   │   ├── map/         # Interactive city map
│   │   ├── govern/      # Proposals + voting
│   │   ├── jobs/        # Gigs marketplace
│   │   ├── aid/         # Mutual aid network
│   │   ├── resources/   # Service directory
│   │   ├── safety/      # Wellness + emergency
│   │   ├── admin/       # Platform management
│   │   └── profile/     # Settings + transactions
│   ├── api/
│   │   ├── ubi/         # Daily UBI distribution
│   │   └── mi/          # AI assistant endpoint
│   └── auth/callback/   # OAuth handler
├── components/
│   ├── shell/           # Navigation, top bar, auth
│   ├── mi/              # AI assistant UI
│   └── ui/              # Reusable components
├── lib/
│   ├── supabase/        # Client, server, middleware
│   ├── store/           # Zustand state
│   ├── hooks/           # Real-time subscriptions
│   └── utils/           # Helpers
└── types/               # TypeScript definitions
```

## Security

- Row Level Security on every table
- Service role key never exposed to client
- Encrypted vault storage (private bucket)
- Safety Mode: one-tap to hide from all searches
- Anonymous tips: zero traceability

## License

MIT — Community-owned. People-powered.
