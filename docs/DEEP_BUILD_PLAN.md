# MiLyfe MVP — Deep Build Plan

**Date:** 24 August 2026  
**Goal:** Take every feature from shallow scaffold to full production depth.  
**Standard:** 2026 super-app quality. Not a demo. A real product someone would use on a Tuesday.

---

## Current State Summary

| Feature | What Exists | What's Broken/Missing |
|---------|------------|----------------------|
| **Wallet** | Balance display, raw client-side send | Proper server-action wiring, jar management UI, transaction detail, pagination, send-with-confirmation flow |
| **Learn** | Path list, enrollment, module list | Module content rendering, progress updates, assessments, offline content, teach mode |
| **Street** | 4-tab display with cards | ALL create/claim/submit forms, all API mutations, search/filter, map view |
| **Safety** | Leave-now + timer + contacts | Real-time timer (server-push), encrypted journal page, push notifications, location logic |
| **Governance** | Create + vote (raw client) | Server-side validation, delegation, proposal comments, lifecycle automation, quorum enforcement |
| **Mi** | Chat UI, non-streaming, rails | Streaming responses, function calling end-to-end, message persistence, ambient bubble, conversation history |
| **Profile** | Display + inline edit + standing | Avatar upload, privacy controls, attestation giving, connection management |
| **Onboarding** | 3-step wizard | Avatar, interests, Mi introduction, URL-persistent steps, passkey setup |
| **Shell** | Nav + notification real-time | Mi ambient FAB, search, dark mode, breadcrumbs |

**Unused installed deps:** react-hook-form, framer-motion, tiptap, livekit, maplibre-gl, meilisearch (all in package.json, zero usage in code)

---

## Deep Build Principles

1. **Every button does something.** No decorative buttons. If it looks clickable, it works.
2. **Every form uses react-hook-form + zod.** Consistent validation, error states, loading states.
3. **Every list has real-time.** Supabase subscriptions for live updates (new posts, new quests, vote changes).
4. **Every view has animations.** Framer-motion for page transitions, list reordering, state changes.
5. **Every card is interactive.** Click → detail view or action sheet.
6. **Mi is everywhere.** Floating bubble in shell, contextual suggestions, not just a page.
7. **Offline works.** Critical data cached in Dexie. Actions queue and sync.
8. **Maps where relevant.** Resources, quests, surplus, rides — MapLibre integration.
9. **Rich text where needed.** Tiptap for proposals, forum posts, wiki edits.
10. **Streaming AI.** Mi streams responses token-by-token. Function calls execute in real-time.

---

## Build Phases (Priority Order)

### Phase 1: Foundation Fixes (Wire everything correctly)
**Goal:** Connect existing server actions to views, add react-hook-form, fix raw client inserts.

| Task | Files | What Changes |
|------|-------|-------------|
| Wire wallet transfer to proper server action | `wallet-view.tsx` | Replace raw Supabase insert with `transferMLY` server action |
| Wire governance to server action | `governance-view.tsx` | Replace raw voting + proposal inserts with validated server actions |
| Add react-hook-form to all forms | All form components | Consistent validation, errors, loading states |
| Add `useTransition` for server actions | All mutation components | Loading spinners, optimistic updates |

**New files:**
- `src/lib/actions/governance.ts` — createProposal, castVote, closeProposal (validated)
- `src/lib/actions/street.ts` — createListing, claimQuest, submitEvidence, claimSurplus, createQuest, createSurplus
- `src/lib/actions/learn.ts` — startModule, completeModule, submitAssessment
- `src/lib/actions/profile.ts` — updateProfile, uploadAvatar, giveAttestation

---

### Phase 2: Street Tab — Full Depth
**Goal:** Every action in Street works end-to-end.

| Feature | Depth |
|---------|-------|
| **Create Listing** | Modal form (react-hook-form + zod): title, description, category, price, images (upload to Supabase Storage), location (MapLibre picker), expiry |
| **Listing Detail** | Full page: seller info, images carousel, contact seller button, $MLY buy button, mark as sold |
| **Create Quest** | Modal form: title, description, category, reward (from own pot or request treasury), difficulty, location, time estimate, verification settings |
| **Claim Quest** | Button on quest card → confirms claim → status updates real-time |
| **Submit Evidence** | Form with text + image upload → sends to creator for verification |
| **Verify Quest** | Creator gets notification → approve/reject with reason |
| **Claim Surplus** | Button → confirms → updates status → notifies donor → shows pickup details |
| **Create Surplus** | Modal form: title, category, pickup location (MapLibre), expiry time |
| **Search/Filter** | Meilisearch integration for listings + quests. Category filter chips. Distance sort. |
| **Map View** | MapLibre showing resources/quests/surplus as pins. Click pin → card. |
| **Real-time** | New listings/quests/surplus appear live via Supabase subscription |

**New files:**
- `src/app/(platform)/street/listing/[id]/page.tsx` — Listing detail
- `src/app/(platform)/street/quest/[id]/page.tsx` — Quest detail + claim/verify
- `src/components/street/create-listing-modal.tsx`
- `src/components/street/create-quest-modal.tsx`
- `src/components/street/create-surplus-modal.tsx`
- `src/components/street/submit-evidence-modal.tsx`
- `src/components/street/street-map.tsx` — MapLibre integration
- `src/components/street/search-bar.tsx` — Meilisearch-powered

---

### Phase 3: Learn Tab — Full Depth
**Goal:** Members can actually DO modules, see content, track progress, and earn badges.

| Feature | Depth |
|---------|-------|
| **Module Content Page** | `learn/[slug]/[module]/page.tsx` — renders markdown content with interactive elements |
| **Progress Tracking** | Start module → in_progress. Complete → completed. Time tracking. |
| **Assessment Types** | Quiz (multiple choice), portfolio (text + image upload), reflection (free text), project (link + description) |
| **Badge Earning** | Complete all modules → badge auto-issued + celebration animation + notification |
| **Offline Packs** | Download path content to Dexie for offline learning |
| **Teach Mode** | `learn/teach/` — create classes, publish curriculum, manage students |
| **Class Detail** | Enrollment, discussion thread (Matrix integration later, Supabase messages for now) |

**New files:**
- `src/app/(platform)/learn/[slug]/[module]/page.tsx` — Module content page
- `src/components/learn/module-content.tsx` — Markdown renderer + interactive elements
- `src/components/learn/assessment-quiz.tsx`
- `src/components/learn/assessment-portfolio.tsx`
- `src/components/learn/assessment-reflection.tsx`
- `src/components/learn/download-offline-button.tsx`
- `src/app/(platform)/learn/teach/page.tsx`
- `src/app/(platform)/learn/teach/create/page.tsx`

---

### Phase 4: Mi Helper — Full Depth
**Goal:** Mi streams, calls functions, persists conversations, and lives in the shell.

| Feature | Depth |
|---------|-------|
| **Streaming** | Switch to Vercel AI SDK `useChat` hook with streaming. Token-by-token rendering. |
| **Function Calling** | Tools actually execute: search resources, draft $MLY, suggest paths, explain proposals |
| **Tool Results UI** | When Mi calls a function, show the result inline (resource cards, draft confirmation) |
| **Message Persistence** | Store conversations in Supabase. Load history on page revisit. |
| **Ambient Bubble** | Floating Mi button in shell (bottom-right). Expands to chat drawer. Contextual suggestions. |
| **Context Awareness** | Mi knows which page you're on. On wallet page: "Want me to help send $MLY?" On learn: "Need help choosing a path?" |
| **Voice Input** | Web Speech API for voice-to-text input |
| **Conversation Memory** | Opt-in: Mi remembers your preferences, upcoming dates, patterns |

**New files:**
- `src/components/mi/mi-bubble.tsx` — Floating action button + drawer
- `src/components/mi/mi-context-hint.tsx` — Contextual suggestion cards
- `src/components/mi/tool-result-card.tsx` — Inline function call results
- `src/components/mi/voice-input.tsx` — Mic button with Web Speech API
- `src/app/api/mi/chat/route.ts` — Rewrite for streaming + function execution
- `src/lib/mi/execute-tool.ts` — Actually runs tools against DB/APIs
- `supabase/migrations/006_mi_conversations.sql` — conversations + messages tables

---

### Phase 5: Wallet — Full Depth
**Goal:** Pocket tab feels like a real fintech app.

| Feature | Depth |
|---------|-------|
| **Send Flow** | Multi-step: select recipient (search by name) → amount → pot → reason → confirm → animated success |
| **Jar Management** | Create/name jars (goals). Move between pots. Visual savings progress. |
| **Transaction Detail** | Click any transaction → full detail with receipt, reversal option (if within window), appeal link |
| **UBI Celebration** | When weekly UBI arrives: green pulse animation, confetti, "Your $MLY arrived!" |
| **Balance Animation** | Animated number spring (framer-motion) on balance changes |
| **QR Pay** | Generate QR code with payment request. Scan to send. |
| **Walking Animation** | When credits are in transit (mesh/offline): animated walking indicator |
| **History Pagination** | Infinite scroll with date separators |

**New files:**
- `src/components/wallet/send-flow.tsx` — Multi-step send wizard
- `src/components/wallet/jar-manager.tsx` — Create/manage savings jars
- `src/components/wallet/transaction-detail.tsx` — Full receipt view
- `src/components/wallet/ubi-celebration.tsx` — Arrival animation
- `src/components/wallet/qr-pay.tsx` — QR generation + scanning
- `src/components/wallet/animated-balance.tsx` — Spring-animated number

---

### Phase 6: Governance — Full Depth
**Goal:** Voice tab is real participatory democracy.

| Feature | Depth |
|---------|-------|
| **Proposal Lifecycle** | Idea → Talk → Try → Decide → What Happened (full state machine, auto-close) |
| **Rich Text Proposals** | Tiptap editor for proposal body |
| **Comments/Discussion** | Threaded comments on proposals with upvotes |
| **Delegation** | Delegate your vote to someone on specific topics. Revoke anytime. Weight display. |
| **Live Voting** | Real-time vote count via Supabase subscription. Progress bar animates. |
| **Quorum Indicator** | "15 more votes needed for quorum" with progress ring |
| **Results Page** | Visual results with participation stats, delegation transparency |
| **Circle Management** | View your circles, circle treasury, steward info |

**New files:**
- `src/components/governance/proposal-editor.tsx` — Tiptap rich text
- `src/components/governance/comment-thread.tsx`
- `src/components/governance/delegation-manager.tsx`
- `src/components/governance/vote-progress-live.tsx` — Real-time animated
- `src/components/governance/circle-card.tsx`
- `src/app/(platform)/governance/[id]/page.tsx` — Proposal detail + discussion
- `src/app/(platform)/governance/circles/page.tsx`
- `src/lib/actions/governance.ts` — Full server actions

---

### Phase 7: Safety — Full Depth
**Goal:** Life-saving features that actually notify people.

| Feature | Depth |
|---------|-------|
| **Server-Side Timer** | Supabase Edge Function or cron that checks expired timers and escalates |
| **Push Notifications** | Web Push API for timer expiry alerts to contacts |
| **Encrypted Journal** | Full page with client-side AES-GCM encryption, save to Supabase (server can't read) |
| **Witness Mode** | MediaRecorder API for audio recording, streams to encrypted storage |
| **Safety Plan Builder** | Multi-step guided flow: go-bag checklist, emergency contacts, safe places, documents |
| **Real-Time Timer** | Supabase subscription so timer updates if extended from another device |

**New files:**
- `src/app/(platform)/safety/journal/page.tsx` — Encrypted journal
- `src/components/safety/journal-editor.tsx` — Encrypt-on-save
- `src/components/safety/witness-mode.tsx` — Audio recording
- `src/components/safety/safety-plan-builder.tsx` — Guided checklist
- `src/lib/safety/crypto.ts` — AES-GCM encrypt/decrypt helpers
- `supabase/functions/timer-escalation/` — Edge function for server-side timer checks

---

### Phase 8: Profile & Onboarding — Full Depth
**Goal:** Identity feels real. Onboarding is a journey.

| Feature | Depth |
|---------|-------|
| **Avatar Upload** | Image picker + crop + Supabase Storage upload |
| **Standing Visualization** | Animated radar chart (8 facets) with framer-motion growth |
| **Privacy Dashboard** | "Right now, X people can see your location" live display. Toggle controls. |
| **Give Attestation** | From someone's profile: attest a facet with reason |
| **Connection Management** | Accept/reject/block connections. View mutual connections. |
| **Onboarding V2** | 5-step: Profile → Avatar → Interests → Mi Introduction → First Quest |
| **Mi Introduction** | Animated Mi introduction during onboarding (helper explains features) |
| **Passkey Setup** | WebAuthn passkey creation during onboarding (no passwords) |

**New files:**
- `src/components/profile/avatar-upload.tsx` — Crop + upload
- `src/components/profile/standing-radar.tsx` — Animated radar chart
- `src/components/profile/privacy-dashboard.tsx` — Live privacy controls
- `src/components/profile/give-attestation.tsx` — Attest someone
- `src/components/profile/connections-list.tsx` — Manage connections
- `src/app/(platform)/onboarding/` — Rebuild as 5-step with persistence

---

### Phase 9: Shell & Cross-Cutting
**Goal:** The app feels alive and connected.

| Feature | Depth |
|---------|-------|
| **Mi Floating Bubble** | Always-present in corner. Tap → drawer chat. Context-aware hints. |
| **Search** | Global search (Meilisearch): profiles, resources, listings, quests, proposals, paths |
| **Dark Mode Toggle** | In profile settings + respects system preference |
| **Page Transitions** | Framer-motion `AnimatePresence` for route changes |
| **Pull-to-Refresh** | Mobile: pull down to refresh current view |
| **Toast Notifications** | Sonner toasts for all mutations (send, vote, enroll, claim) |
| **Real-Time Everywhere** | Supabase subscriptions on: wallet balance, governance votes, street items, messages |
| **Offline Indicator** | Show sync status. Queue count. "Offline mode" banner. |

---

## Execution Plan

| Phase | Estimated Files | Priority | Dependencies |
|-------|----------------|----------|-------------|
| Phase 1: Foundation | ~10 files | P0 — do first | None |
| Phase 2: Street | ~15 files | P0 | Phase 1 (server actions) |
| Phase 3: Learn | ~12 files | P0 | Phase 1 |
| Phase 4: Mi | ~10 files | P1 | Phase 1 |
| Phase 5: Wallet | ~8 files | P1 | Phase 1 |
| Phase 6: Governance | ~10 files | P1 | Phase 1 |
| Phase 7: Safety | ~8 files | P1 | Phase 1 |
| Phase 8: Profile | ~10 files | P2 | Phase 1 |
| Phase 9: Shell | ~8 files | P2 | Phase 4 (Mi bubble) |

**Total: ~90 new/rewritten files across 9 phases.**

---

## NPM Packages to Actually Use

These are installed but have zero usage. Each phase wires them in:

| Package | Used In | Phase |
|---------|---------|-------|
| `react-hook-form` + `@hookform/resolvers` | Every form (listings, quests, proposals, transfers, profile) | Phase 1+ |
| `framer-motion` | Balance animation, page transitions, standing radar, celebrations | Phase 5, 9 |
| `@tiptap/react` + starter-kit | Proposal editor, forum posts, wiki editing | Phase 6 |
| `maplibre-gl` | Street map view, resource pins, quest locations | Phase 2 |
| `meilisearch` | Search bar (global), street search, resource search | Phase 2, 9 |
| `@livekit/components-react` | Future: voice calls, video rooms (Phase 10+) | — |
| `dexie` + `dexie-react-hooks` | Offline learn content, wallet cache, resource cache | Phase 3, 9 |

---

## Success Criteria (The Tuesday Test — Deep Version)

> Wake → **Mi suggests** "Good morning. You have a court date in 3 days. Rue can help you prep." →
> Kid to class → **Learn tab** shows kid's progress, offline pack downloaded →
> Surplus food pin → **Street tab**: see pin on map, tap, claim, get pickup directions →
> Learn path → **Module page** renders content, complete exercise, progress saves, works offline →
> Thank the neighbor → **Wallet**: search name, amount, reason, animated send, receipt generated →
> Vote shade sails → **Governance**: read proposal (Tiptap rendered), see discussion, cast vote, live count updates →
> Evening hello → **Mi bubble**: "3 people checked in today. Maria's timer expired — she confirmed safe." →
> Story only if you tap in → **Profile**: privacy controls show "0 people see your location"

Every step: **instant feedback, real-time updates, works offline, animated, accessible.**
