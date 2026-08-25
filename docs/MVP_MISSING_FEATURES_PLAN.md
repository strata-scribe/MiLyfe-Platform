# MiLyfe MVP — Missing Features Implementation Plan

**Date:** 24 August 2026  
**Scope:** 15 features missing from current MVP that the Sovereign Infrastructure Design requires at Seed/Sprout stage  
**Repo:** `/home/milyfe/Documents/MiLyfe/milyfe-platform`

---

## Key GitHub Repositories & NPM Packages

### Coordination Layer (OS 2)
| Dependency | GitHub | NPM | Purpose |
|-----------|--------|-----|---------|
| OpenFGA | [openfga/openfga](https://github.com/openfga/openfga) | `@openfga/sdk` | Relationship-based access control (MiScope) |
| OpenFGA JS SDK | [openfga/js-sdk](https://github.com/openfga/js-sdk) | `@openfga/sdk` | Node.js/JS client for OpenFGA |
| OPA (WASM) | [open-policy-agent/opa](https://github.com/open-policy-agent/opa) | `@open-policy-agent/opa-wasm` | Policy evaluation in browser/server |
| NATS.js | [nats-io/nats.js](https://github.com/nats-io/nats.js) | `nats` | Event bus (JetStream) |
| Zod | Already in project | `zod` | Runtime schema validation for MiAction |

### AI (OS 5)
| Dependency | GitHub | NPM | Purpose |
|-----------|--------|-----|---------|
| Wllama | [ngxson/wllama](https://github.com/ngxson/wllama) | `@anthropic-ai/wllama` or build | llama.cpp WASM — Ring 0 on-device inference |
| Web-LLM | [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) | `@mlc-ai/web-llm` | WebGPU browser LLM (Ring 0 alternative) |
| Vercel AI SDK | [vercel/ai](https://github.com/vercel/ai) | `ai` | Streaming chat UI + function calling |
| Ollama (Ring 1) | [ollama/ollama](https://github.com/ollama/ollama) | `ollama` | Local server inference |

### Communication / Offline (OS 4)
| Dependency | GitHub | NPM | Purpose |
|-----------|--------|-----|---------|
| Serwist | [serwist/serwist](https://github.com/serwist/serwist) | `serwist`, `@serwist/next` | Service worker / PWA / offline shell |
| Dexie.js | Already installed | `dexie` | IndexedDB wrapper for offline data |
| Matrix JS SDK | [matrix-org/matrix-js-sdk](https://github.com/matrix-org/matrix-js-sdk) | `matrix-js-sdk` | E2EE messaging (future) |

### Maps / Location (OS 3 / Street)
| Dependency | GitHub | NPM | Purpose |
|-----------|--------|-----|---------|
| MapLibre GL JS | Already installed | `maplibre-gl` | Map rendering |
| react-map-gl | [visgl/react-map-gl](https://github.com/visgl/react-map-gl) | `react-map-gl` | React wrapper for MapLibre |

### Education (OS 8)
| Dependency | GitHub | NPM | Purpose |
|-----------|--------|-----|---------|
| Kolibri | [learningequality/kolibri](https://github.com/learningequality/kolibri) | N/A (separate service) | Offline education (future integration) |
| — | — | — | For MVP: custom learn system using existing DB |

---

## Priority Order (What to Build First)

### Why this order:
1. **MiAction + MiScope** — Everything else depends on consistent action handling and permissions
2. **Learn tab** — "Human development is the product" — core tab is missing
3. **Street tab** — Marketplace, quests, resources — the community engine
4. **Safety** — "Worst-case-first" — cannot launch without safety protocols
5. **AI helper** — Mi is the face of the platform — makes everything discoverable
6. **Offline-first** — "Works when internet fails" — PWA + Dexie sync
7. **Remaining** — Receipts, freshness, crons — polish layer

---

## Build Batches

### Batch 1: MiAction Envelope + MiScope Permissions
**New files:**
- `src/lib/mi-action/` — MiAction envelope types, validation (Zod), state machine
- `src/lib/mi-scope/` — Permission checking layer (simplified OpenFGA logic using Supabase RLS + custom checks)
- `supabase/migrations/002_mi_action_scope.sql` — action_log table, permission cache
- `src/lib/mi-action/types.ts` — Full TypeScript interface matching JSON schema
- `src/lib/mi-action/validate.ts` — Zod schema validation
- `src/lib/mi-action/state-machine.ts` — State transitions
- `src/lib/mi-scope/check.ts` — Permission check functions
- `src/lib/mi-scope/preview.ts` — "What can this person see?" API

**Approach:** For MVP, we don't need full OpenFGA server. We implement the MiScope logic as a TypeScript layer on top of Supabase RLS. The schema and API are compatible — when we scale to OpenFGA server, we swap the adapter.

### Batch 2: Learn Tab
**New files:**
- `src/app/(platform)/learn/` — Learn tab pages
- `src/app/(platform)/learn/page.tsx` — Journey overview
- `src/app/(platform)/learn/[path]/page.tsx` — Path detail
- `src/app/(platform)/learn/[path]/[module]/page.tsx` — Module content
- `src/components/learn/` — Journey map, module card, progress bar
- `supabase/migrations/003_learn_schema.sql` — paths, modules, progress, badges

**Tables needed:**
- `learn_paths` — The 10 paths with metadata
- `learn_modules` — Individual modules within paths
- `learn_progress` — Member progress tracking
- `learn_completions` — Completed modules + assessments

### Batch 3: Street Tab (Marketplace + Quests + Resources)
**New files:**
- `src/app/(platform)/street/` — Street tab (replaces or extends current bounties/connect)
- `src/app/(platform)/street/marketplace/` — Buy/sell/trade
- `src/app/(platform)/street/quests/` — Community tasks
- `src/app/(platform)/street/resources/` — Shelters, food, legal, clinics
- `src/app/(platform)/street/surplus/` — Food/goods about to expire
- `src/components/street/` — Listing cards, quest cards, map view
- `supabase/migrations/004_street_schema.sql` — listings, quests, resources, surplus

**Tables needed:**
- `marketplace_listings` — Goods/services for sale
- `quests` — Community tasks with $MLY rewards
- `quest_completions` — Who completed what
- `community_resources` — Shelters, clinics, food banks (with MiSource freshness)
- `surplus_items` — Time-limited free stuff

### Batch 4: Safety System
**New files:**
- `src/app/(platform)/safety/` — Safety section (accessible from You tab)
- `src/components/safety/` — Leave-now button, walk-home timer, witness mode
- `src/lib/safety/` — Leave-now protocol, timer logic, freeze functions
- `supabase/migrations/005_safety_schema.sql` — safety_actions, timers, freezes

**Tables needed:**
- `safety_actions` — Leave-now triggers, freeze records
- `walk_home_timers` — Active timers with contacts
- `safety_contacts` — Pre-configured emergency contacts
- Wallet freeze function (RPC)

### Batch 5: Mi Helper (AI Chat)
**New files:**
- `src/app/(platform)/mi/` — Mi chat interface (ambient, not just a page)
- `src/components/mi/` — Chat bubble, context panel, suggestion cards
- `src/lib/mi/` — Helper routing, function calling, rail checks
- `src/app/api/mi/chat/route.ts` — Streaming chat endpoint
- `src/lib/mi/tools/` — Function-calling tool definitions
- `src/lib/mi/rails.ts` — Non-negotiable limits checker

**Approach:** 
- Use Vercel AI SDK (`ai` package) for streaming chat UI
- Backend: proxy to Ollama (Ring 1) or OpenAI-compatible API
- Function calling: pocket_draft_thank, street_search_resource, learn_suggest_path, safety_escalate, handoff_to_human
- Rails enforcement in middleware before every response

### Batch 6: Offline-First (PWA)
**New files:**
- `src/app/sw.ts` — Service worker (Serwist)
- `src/lib/offline/` — Sync engine, outbox pattern
- `src/lib/offline/outbox.ts` — Queue actions when offline
- `src/lib/offline/sync.ts` — Replay outbox when online
- `src/lib/store/offline-db.ts` — Dexie schema for offline cache
- `next.config.mjs` update — Serwist plugin
- `public/manifest.json` — PWA manifest

**Approach:**
- Serwist for service worker + caching strategies
- Dexie (already installed) for offline IndexedDB store
- Outbox pattern: actions queue locally, sync when connectivity returns
- Critical data cached: profile, wallet balance, recent messages, learn progress, resources

### Batch 7: Remaining Items
**New files:**
- `src/lib/mi-receipt/` — Receipt generation (simplified W3C VC)
- `src/lib/mi-source/` — Freshness metadata for resources
- `src/app/api/cron/ubi/route.ts` — Weekly UBI distribution
- `src/app/api/cron/decay/route.ts` — Standing decay
- `src/app/api/cron/freshness/route.ts` — Resource freshness checker
- `supabase/migrations/006_receipts_freshness.sql` — receipts table, source metadata columns

---

## Database Migration Summary

| Migration | Tables Added | Purpose |
|-----------|-------------|---------|
| 002 | `action_log`, `permission_cache` | MiAction + MiScope |
| 003 | `learn_paths`, `learn_modules`, `learn_progress`, `learn_completions` | Education |
| 004 | `marketplace_listings`, `quests`, `quest_completions`, `community_resources`, `surplus_items` | Street |
| 005 | `safety_actions`, `walk_home_timers`, `safety_contacts` | Safety |
| 006 | `action_receipts`, `resource_freshness` | Receipts + Source |

---

## New NPM Dependencies to Install

```bash
npm install @openfga/sdk zod ai @ai-sdk/openai serwist @serwist/next
```

**Optional / Future:**
```bash
npm install nats @open-policy-agent/opa-wasm matrix-js-sdk @mlc-ai/web-llm
```

---

## Architecture Decision: MVP Pragmatism

The Sovereign Infrastructure Design describes the full vision (OpenFGA server, NATS JetStream, CometBFT chain, etc.). For the MVP, we take a **pragmatic approach**:

| Full Vision | MVP Implementation | Migration Path |
|-------------|-------------------|----------------|
| OpenFGA server | TypeScript permission layer on Supabase RLS | Swap adapter when scaling |
| NATS JetStream | Supabase Realtime + PostgreSQL LISTEN/NOTIFY | Add NATS at Trunk stage |
| OPA policy engine | TypeScript policy functions + Zod validation | Compile to WASM later |
| CometBFT chain | PostgreSQL ledger (SQL mode) | Chain at Canopy stage |
| Matrix Synapse | Supabase messages table (current) | Matrix at Root stage |
| Kolibri offline | Custom learn system + Dexie cache | Kolibri integration at Trunk |
| Full mesh (LoRa, BLE) | PWA offline + service worker | Mesh hardware at Sprout |
| 25 named helpers | Mi (general) + 2-3 specialist helpers | Add helpers at Sprout stage |
| W3C Verifiable Credentials | JSON receipts in DB (VC-compatible schema) | Sign with Ed25519 later |

This approach means: **same interfaces, simpler backends, easy upgrade path.**

---

## Success Criteria

When all 7 batches are complete, the MVP will pass the **Tuesday Test:**

> Wake → optional check-in → kid to class or street tutor → surplus food pin → Learn path → thank the neighbor → vote shade sails → evening hello → story only if you tap in.

Every step in that flow will have a working UI route and backend function.
