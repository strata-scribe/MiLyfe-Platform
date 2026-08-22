# MiLyfe Platform — FULL FRACTAL AUDIT

**Date:** August 22, 2026  
**Standard:** Every feature works for real. No placeholders. No "coming soon". No fake data. No API keys needed.

---

## CRITICAL ISSUES (Must Fix)

### A. Pages Using HARDCODED FAKE DATA Instead of Supabase (12 pages)

These pages import `createClient` but then SET STATIC ARRAYS instead of querying the database. They look full but are actually fake demos.

| # | File | Problem |
|---|------|---------|
| 1 | `/guild/page.tsx` | Patrols, team, incidents, shifts are all hardcoded arrays |
| 2 | `/achievements/page.tsx` | Badges, paths, challenges, leaderboard are hardcoded |
| 3 | `/news/page.tsx` | Articles, local articles, verified articles are hardcoded |
| 4 | `/twin/page.tsx` | Traits, predictions, privacy controls are hardcoded |
| 5 | `/record/page.tsx` | Recordings, reports, rewards are hardcoded |
| 6 | `/nav/page.tsx` | POIs, routes, transit, gas stations, commute stats are hardcoded |
| 7 | `/settings/page.tsx` | Notification preferences, blocked users are hardcoded |
| 8 | `/housing/page.tsx` | Listings, saved, documents, maintenance are hardcoded |
| 9 | `/wiki/page.tsx` | Pages, recent edits, my-edits are hardcoded |
| 10 | `/transparency/page.tsx` | Stats, budget, moderation actions, audit log are hardcoded |
| 11 | `/onboarding/page.tsx` | Setup fields, explore cards are hardcoded |
| 12 | `/govern/page.tsx` | Proposals, delegates, history are hardcoded |
| 13 | `/wallet/budget/page.tsx` | Budget categories are hardcoded |

### B. "Coming Soon" / Placeholder Buttons (16 instances)

Buttons that show a toast saying "coming soon" instead of doing anything:

| # | File | Line | What it says |
|---|------|------|-------------|
| 1 | `/veterans/page.tsx` | 184 | "Skills translation coming soon" |
| 2 | `/immigrant/page.tsx` | 175 | "Language exchange matching coming soon" |
| 3 | `/immigrant/page.tsx` | 233 | "Orientation scheduling coming soon" |
| 4 | `/access/page.tsx` | 220 | "Group creation coming soon" |
| 5 | `/parents/page.tsx` | 117 | "Full calendar coming soon" |
| 6 | `/parents/page.tsx` | 161 | "Exchange matching coming soon" |
| 7 | `/parents/page.tsx` | 188 | 4x co-parenting tools "coming soon" |
| 8 | `/health/page.tsx` | 386 | "Coming soon: Set custom health targets" |
| 9 | `/social/[id]/page.tsx` | 268 | "Activity feed coming soon" |
| 10 | `/media/tv/page.tsx` | 359 | DVR "Coming soon" text |
| 11 | `/media/analytics/page.tsx` | 283 | "Detailed demographics coming soon" |
| 12 | `/finance/will/page.tsx` | 186 | POA/Healthcare templates "coming soon" |
| 13 | `/dev-portal/page.tsx` | 139, 149 | SDK + App management "coming soon" |
| 14 | `/security/page.tsx` | 203 | "Coming Soon" label |
| 15 | `/auto/page.tsx` | 185 | Map integration "coming soon" |
| 16 | `/youth/page.tsx` | 215 | "More courses coming soon!" |

### C. External API Key Dependencies (Still in Code)

These files REQUIRE an external API key to function. Without the key, the feature is dead:

| # | File | Key Required | Impact |
|---|------|-------------|--------|
| 1 | `/api/mi/route.ts` | GROQ_API_KEY | Mi AI chatbot does nothing without it |
| 2 | `livekit-room.tsx` | LIVEKIT_URL + keys | Video/audio rooms show "Set LIVEKIT_URL..." message |
| 3 | `lib/analytics/posthog.ts` | POSTHOG_KEY | Old PostHog code still in codebase (dead code) |
| 4 | `lib/email/send.ts` | RESEND_API_KEY | Email sending fails silently |
| 5 | `lib/infra/cache.ts` | UPSTASH_REDIS_REST_URL | Redis cache doesn't work |
| 6 | `lib/rate-limit.ts` | UPSTASH_REDIS_REST_URL | Old rate limiter doesn't work |
| 7 | `lib/jobs/queue.ts` | QSTASH_TOKEN | Background job queue doesn't work |

### D. Visual/UX Placeholders

| # | File | What |
|---|------|------|
| 1 | `/twin/page.tsx` | "DiceBear Avatar Placeholder" text shown to user |
| 2 | `/onboarding/page.tsx` | "Video placeholder: Community Introduction" shown |
| 3 | `/wiki/page.tsx` | "Novel Rich Text Editor Placeholder" shown |
| 4 | `/city/[id]/page.tsx` | Google Maps static map with `key=placeholder` (broken image) |
| 5 | `/nav/page.tsx` | "MapLibre Interactive Map" text instead of actual map |

### E. Dead/Unused Code Still in Codebase

| File | Status |
|------|--------|
| `lib/analytics/posthog.ts` | Dead — replaced by `lib/infra/analytics.ts` but still imported |
| `lib/rate-limit.ts` | Dead — replaced by `lib/infra/rate-limiter.ts` but still exists |
| `lib/infra/cache.ts` | Depends on Upstash — doesn't work without key |
| `lib/jobs/queue.ts` | Depends on QStash — doesn't work without key |
| `@uppy/core`, `@uppy/tus`, `@uppy/react`, `@uppy/dashboard` | Installed but never actually imported in any page |
| `@emoji-mart/react`, `@emoji-mart/data` | Installed but never imported |
| `react-easy-crop` | Installed but never imported |
| `@livekit/components-react`, `livekit-client` | Imported in 1 component that shows a placeholder |
| `@react-pdf/renderer` | Used in template file but no API route actually generates PDFs |
| `next-safe-action` | Client created but example actions are never called from any page |

---

## SUMMARY

| Category | Count | Severity |
|----------|-------|----------|
| Pages with fake/hardcoded data | 13 | 🔴 Critical |
| "Coming soon" buttons | 16 | 🟡 High |
| External API key dependencies | 7 | 🔴 Critical |
| Visual placeholders shown to users | 5 | 🟡 High |
| Dead/unused code & packages | 10 | 🟠 Medium |
| **TOTAL ISSUES** | **51** | |

---

## THE STANDARD (from design docs)

> "No filing paperwork. No asking permission."  
> "Everything open-source. No proprietary dependencies."  
> "Each feature should feel like a full app (3+ sub-pages, real workflows), not a demo page."

**Verdict:** ~13 pages violate "feel like a full app" because they use hardcoded demo data. 7 features silently fail without external API keys. The platform LOOKS complete but ~20% of it is a painted facade.

---

## FIX PLAN

1. **Convert 13 hardcoded pages to real Supabase queries** — Create missing tables, seed with real starter data, wire queries
2. **Replace all 16 "coming soon" with actual functionality** — Build the features or remove the buttons
3. **Remove ALL external key dependencies** — Replace Groq AI with a Supabase-powered response system, replace LiveKit with built-in WebRTC signaling via Supabase Realtime, delete PostHog/Upstash/QStash code
4. **Fix all 5 visual placeholders** — Use DiceBear API (no key needed) for avatars, MapLibre (already installed) for maps, Novel (already installed) for editors
5. **Delete all dead code and unused packages** — Clean the dependency tree
