# MiLyfe Platform

**Your City. Your Life. Your Platform.**

A community-owned civic platform where every citizen earns $MLY, governs together, connects with neighbors, and accesses resources. No ads. No algorithms. Just people.

**Live:** [milyfe-platform.vercel.app](https://milyfe-platform.vercel.app)

---

## 14 Core Routes

| Route | What it does |
|-------|-------------|
| `/` | Public landing page |
| `/onboarding` | 3-step signup wizard |
| `/home` | Dashboard — balance, standing, rewards, activity |
| `/connect` | Connections, messaging, people search |
| `/wallet` | $MLY three-pot system, transfers, transaction history |
| `/rewards` | Claim UBI, quest rewards, badges |
| `/standing` | 8-facet reputation (Neighbor, Carer, Maker, Teacher, Keeper, Voice, Shop, Helper) |
| `/governance` | Proposals, voting, direct democracy |
| `/news` | Community journalism |
| `/forum` | Discussion spaces |
| `/health` | Wellness check-ins, streak tracking, resource directory |
| `/wiki` | Community knowledge base |
| `/profile` | Profile management, settings, sign out |
| `/apps` | Community-built app directory |

Everything else is a [bounty for contributors](./BOUNTY_ROADMAP.md).

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (Postgres + Auth + RLS) |
| Styling | Tailwind CSS + Radix UI primitives |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Editor | Tiptap |
| Search | Meilisearch |
| Realtime | LiveKit |
| Offline | Dexie.js (IndexedDB) |
| Charts | Recharts |
| Maps | MapLibre GL |
| Notifications | Novu (planned) |

---

## Getting Started

```bash
# Clone
git clone https://github.com/RealMiLyfe/MiLyfe-Platform.git
cd MiLyfe-Platform

# Install
npm install

# Environment
cp .env.local.example .env.local
# Fill in your Supabase credentials

# Run migration
# Apply supabase/migrations/001_mvp_schema.sql to your Supabase project

# Dev
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server only)
UBI_CRON_SECRET=                 # Secret for the daily UBI distribution cron
```

Optional (for full feature set):
```
MEILISEARCH_URL=                 # Search (default: localhost:7700)
LIVEKIT_URL=                     # Video/audio calls
REDIS_URL=                       # Caching
LITELLM_URL=                     # AI helpers
```

---

## Architecture

```
src/
├── app/
│   ├── (auth)/          # Login, signup (public)
│   ├── (platform)/      # 13 authenticated routes
│   ├── api/             # Auth callback, UBI cron
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── components/
│   ├── shell/           # Sidebar, top bar, bottom nav, auth provider
│   └── ui/              # Button, Card, Badge, Skeleton, Tabs, etc.
├── lib/
│   ├── actions/         # Server actions (wallet ops)
│   ├── hooks/           # useUser
│   ├── store/           # Zustand global state
│   ├── supabase/        # Client, server, middleware helpers
│   └── utils/           # cn()
└── types/
    └── database.ts      # Typed Supabase schema (25 tables)
```

---

## Database

25 tables with Row Level Security:

**Identity:** profiles, standing, attestations, badges, user_badges  
**Economy:** wallets, transactions, rewards, community_treasury  
**Social:** connections, messages, notifications  
**Civic:** proposals, votes  
**Content:** forum_spaces, forum_posts, forum_replies, wiki_pages, wiki_revisions, news_articles, news_comments  
**Health:** health_checkins, health_resources  
**Apps:** apps, app_reviews

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

**Quick version:**
1. Check [BOUNTY_ROADMAP.md](./BOUNTY_ROADMAP.md) for available bounties
2. Comment on the issue to claim it (7-day lock)
3. Fork → branch → build → PR
4. Earn $MLY + permanent "Built by" credit

---

## Bounty System

160 bounties across 15 domains:

- 🟢 Small (50-150 $MLY) — Single component or fix
- 🟡 Medium (150-500 $MLY) — Full page with DB integration
- 🟠 Large (500-1500 $MLY) — Multi-page system
- 🔴 Epic (1500-5000 $MLY) — Full domain requiring architecture

Bounties appreciate 5%/week if unclaimed. Bonuses for tests (+20%), docs (+10%), speed (+25%).

---

## License

[AGPL-3.0](./LICENSE) — Community-owned, open source, copyleft.

If you build on MiLyfe, your changes must also be open source.

---

*Built for the people who need it most. Governed by the people who use it. Built by the people who believe in it.*
