# MiLyfe — Level 10 Gap Analysis

**Date:** 24 August 2026  
**Method:** Line-by-line code audit of every feature, tracing user flows from click to database and back.  
**Standard:** What a user with expectations of a real app (Cash App, Duolingo, Signal) would demand.

---

## Verdict Summary

| Feature | Current Level | Level 10 Requires |
|---------|:------------:|-------------------|
| Wallet | 6/10 | Atomic transactions, pagination, reward claim UI, transaction search/filter |
| Learn | 7/10 | More paths with content, progress offline cache, certificate export, class creation UI |
| Street | 6/10 | Image upload to Storage, listing detail page, quest verification flow, map pins |
| Governance | 7/10 | Auto-close cron, dedicated comments table, delegation UI, proposal amendments |
| Safety | 5/10 | Server-side timer escalation, push notifications, witness cloud upload, contact SMS/push |
| Mi | 5/10 | Full message persistence + history load, context awareness (current page), voice input, better tool UI confirmation flow |
| Profile | 8/10 | Attestation from other user's profile page, connection accept/reject UI, avatar crop |
| Home | 8/10 | Real-time updates (new quests/proposals appear live), MiPulse ambient indicator |
| Offline | 3/10 | Wire ALL actions through offline wrapper, background sync with SW, cached pages for offline nav |
| Onboarding | 6/10 | Use server action (claims welcome reward), add avatar step, add interest selection, Mi intro |
| Shell | 7/10 | Search results need to link properly, dark mode toggle, notification mark-all-read, Mi bubble context hints |

---

## WALLET — Currently 6/10

### What works
- Send flow (multi-step, validated, server action with debit/credit)
- Jar manager (move between pots)
- Animated balance counter
- Transaction detail modal
- Real-time balance subscription

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **No atomic transaction** — debit and credit are separate queries. If app crashes between them, money disappears. | Critical (data integrity) | Medium — use Supabase RPC with a single PL/pgSQL function that does both in one transaction |
| **No pagination** — only shows last 20 transactions. Users with history can't see older ones. | High (usability) | Easy — add cursor-based pagination with "Load More" button |
| **No transaction search/filter** — can't find a specific payment or filter by type/date. | Medium | Medium — add filter chips (UBI/transfer/reward) + date range |
| **No reward claim in wallet view** — rewards only claimable from home page. Wallet should show pending rewards. | Medium | Easy — add rewards section or badge in wallet view |
| **Send flow doesn't show recipient avatar/name preview** — you type a username but don't see confirmation of WHO you're sending to before confirm step. | Medium (trust) | Easy — fetch and show profile card on username input blur |
| **No transaction export** — MiTax spec requires CSV/PDF export. Nothing implemented. | Medium | Medium — add export button that generates CSV from transaction history |
| **UBI celebration never triggers** — `showUBI` state is never set to true. The check is a comment, not real logic. | Low (delight) | Easy — check `lastTransaction?.type === 'ubi'` from realtime hook |

---

## LEARN — Currently 7/10

### What works
- Path browsing, enrollment, module content rendering
- Progress tracking (auto-calculates %)
- Badge issuance on path completion
- Quiz + reflection/portfolio assessments
- Module navigation (prev/next)

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **Only 1 path has content** — Rights path has 8 modules. Other 9 paths have 0 modules. Users see empty paths. | Critical (content) | Hard (content creation, not code) — need 5-8 modules per path |
| **Standing boost is hardcoded** — `teacher: 5` instead of incrementing current value. Will overwrite existing standing. | High (bug) | Easy — change to `current + increment` pattern |
| **No offline content caching** — Learn is supposed to work offline (Kolibri spec). Zero offline support implemented. | High (spec violation) | Hard — cache module content in Dexie, render from cache when offline |
| **Assessment quiz questions are hardcoded** — Same 3 sample questions for every module. Should come from DB `metadata` column. | High (every quiz is identical) | Medium — store questions in module metadata, load dynamically |
| **No class creation (Teach mode)** — `learn_classes` table exists but no UI to create/manage classes. | Medium | Medium — add /learn/teach page with class creation form |
| **No certificate/badge export** — Spec says badges are portable W3C VCs. Currently just a DB row. | Medium | Medium — generate signed JSON-LD badge that can be exported |
| **No audio content option** — Spec says modules should have audio version. No audio player. | Low | Medium — add optional audio_url field + player component |

---

## STREET — Currently 6/10

### What works
- Create listing/quest/surplus with validated modals
- Quest claiming with fund reservation
- Surplus claiming
- Quest evidence submission + creator verification flow
- All server actions properly validate and revalidate

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **No image upload in listings** — Schema accepts URL array but modal has no file upload. Users must paste URLs manually. | Critical (marketplace is useless without photos) | Medium — add Supabase Storage upload in modal (like avatar upload) |
| **No listing detail page** — Clicking a listing card does nothing. No way to see full description, contact seller, or buy. | Critical (marketplace is browse-only) | Medium — add `/street/listing/[id]` detail page with seller info + buy button |
| **No quest detail page** — Quest claimed but no way to see full description, submit evidence from a dedicated page. | High | Medium — add `/street/quest/[id]` with claim/submit/verify flow |
| **No map view** — MapLibre is installed but never imported. Resources, quests, surplus should show on a map. | High (spec: "What's nearby") | Medium — add map tab in street view, render pins from lat/lon |
| **No search/filter** — Meilisearch installed but unused. Can't search listings by keyword or filter quests by category. | High | Medium — add filter chips + search input wired to Supabase ilike or Meilisearch |
| **Listing expiry not enforced** — Listings set 72h expiry but nothing marks them expired. They show forever. | Medium | Easy — add cron route or filter in query (`expires_at > now()`) |
| **No rides section** — Spec says Street has "Rides: I'm going to [place] at [time]". Completely missing. | Medium | Medium — add rides sub-tab + create ride flow |
| **Quest verification has no notification** — Creator gets no notification when evidence is submitted. Just silently appears if they check. | Medium | Easy — add notification insert on evidence submission |

---

## GOVERNANCE — Currently 7/10

### What works
- Tiptap proposal creation with standing check
- Weighted voting with duplicate prevention
- Proposal detail page with HTML body + vote panel + comments
- Live vote count via Supabase subscription
- Quorum display and progress

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **No auto-close** — Expired proposals stay "active" forever. Must be manually closed by author. | High (stale proposals accumulate) | Easy — add cron that checks `closes_at < now()` and runs `closeProposal` |
| **Comments use wrong table** — Reuses `forum_replies` with `post_id = proposal.id`. Will cause FK conflicts or data mixing. | High (data integrity) | Medium — create `proposal_comments` table or add `context_type` column |
| **No delegation** — Spec says liquid delegation (3-hop, topic-scoped). Zero implementation. | High (spec) | Hard — requires delegation graph, UI to delegate/revoke, weight calculation |
| **No proposal stages** — Spec says Idea → Talk → Try → Decide → What Happened. Current: just "active" or "passed/rejected". | Medium | Medium — add `stage` column, stage transition logic, stage-specific UI |
| **No proposal amendments** — Author can't update proposal after submission. | Medium | Easy — allow body edits while status='active', track revision history |
| **No quorum enforcement in vote display** — If quorum not met and time passes, proposal should auto-reject. Currently just stays open. | Medium | Easy — close cron marks as rejected if quorum not met by deadline |

---

## SAFETY — Currently 5/10

### What works
- Leave-now activation (inserts safety_actions record)
- Wallet freeze check via `is_wallet_frozen()` RPC in transfer API
- Walk-home timer UI with live countdown + arrived/extend buttons
- Encrypted journal (real AES-256-GCM, client-side encrypt/decrypt)
- Safety contacts CRUD
- Witness mode audio recording to local file

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **No server-side timer escalation** — If timer expires and user doesn't respond, NOTHING happens. No contacts notified. No keeper alert. Just shows "OVERDUE" in UI. | Critical (safety feature that doesn't save lives) | Medium — Supabase Edge Function or cron that checks expired timers and sends notifications |
| **No push notifications** — `web-push` installed but unused. Contacts never actually receive alerts. | Critical | Medium — implement VAPID keys, push subscription, send on timer expire + leave-now |
| **Leave-now doesn't revoke sessions** — Comment says `// TODO: Revoke other device sessions`. Abuser's phone still logged in. | Critical (safety) | Medium — use Supabase auth admin to revoke all sessions except current |
| **Witness mode only saves locally** — Audio blob downloads to device. If device is destroyed, recording is gone. | High | Medium — stream/upload to encrypted Supabase Storage bucket |
| **No safety plan builder** — Spec calls for guided checklist (go-bag, safe places, documents). Not implemented. | Medium | Medium — add multi-step form in safety section |
| **Location hiding is not enforced** — `hide_location: true` flag exists but no code actually checks it before sharing location. | Medium | Medium — add MiScope check in any location-sharing feature |

---

## MI — Currently 5/10

### What works
- Streaming SSE chat with token-by-token rendering
- 4 function-calling tools that query real DB tables
- Tool result cards rendered inline (resources, payment draft, learn paths, handoff)
- Safety rail check on input (self-harm → crisis resources)
- Floating bubble available on every page

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **Requires running AI backend** — Defaults to `localhost:11434` (Ollama). Without it, Mi just returns error message. No cloud fallback configured. | Critical (Mi is dead without backend) | Easy — add OpenAI/Anthropic as fallback in env, or show "Mi offline" state gracefully |
| **No conversation persistence across page loads** — Messages are React state only. Refresh = history gone. | High (users expect chat history) | Medium — load conversation history from DB on mount, paginated |
| **User messages not saved server-side** — Only assistant messages are persisted (if conversationId set). User messages lost. | High | Easy — save user messages in the same API route before calling LLM |
| **No context awareness** — Mi doesn't know what page you're on. Should suggest relevant actions based on current route. | Medium (spec: "contextual") | Medium — pass `pathname` to API, inject context hints in system prompt |
| **Draft thank has no inline confirmation** — Tool returns a URL link but user has to navigate to wallet. Should confirm in chat. | Medium | Medium — add "Confirm" button in tool result card that calls transferMLY directly |
| **No voice input** — Spec mentions Web Speech API. Not implemented. | Low | Medium — add mic button with SpeechRecognition API |
| **Output rail check not applied** — `checkOutputRails()` exists but is never called on the response. Only input rails work. | Low (safety) | Easy — run check on accumulated fullContent before final message |

---

## PROFILE — Currently 8/10

### What works
- Avatar upload (react-dropzone → Supabase Storage → profile update)
- Standing radar chart (SVG, real data)
- Privacy dashboard (shows who sees what)
- Profile edit (server action with validation)
- Standing display with all 8 facets
- Attestation giving (with daily limit, notification)
- Sign out

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **Can't give attestation from someone else's profile** — `GiveAttestation` component exists but is only usable if you already have their user ID. No public profile page to view others. | High | Medium — add `/profile/[username]` public profile page with "Recognize" button |
| **No connection accept/reject UI** — `sendConnectionRequest` and `respondToConnection` actions exist, but `/connect` page uses the old UI (doesn't call these). | Medium | Medium — rewrite connect view to use server actions |
| **No avatar crop** — Upload sends raw file. Users can't crop/resize before uploading. | Low | Medium — add client-side crop with `react-easy-crop` |
| **Standing update in attestation doesn't increment properly** — Uses `Math.min(100, currentValue + weight)` but the query fetches the whole standing row first. Works but not atomic. | Low | Low — fine for MVP, use RPC for production |

---

## HOME — Currently 8/10

### What works
- Fetches real data from 9 tables in parallel
- Shows balance, standing, active votes, unclaimed rewards, learn progress, open quests, active proposals, free surplus, treasury
- All sections link to correct pages
- Empty state for new users with CTAs

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **No real-time updates** — Home is server-rendered. New quests, proposals, or surplus don't appear until page refresh. | Medium | Medium — add Supabase subscriptions for key tables, or use `router.refresh()` on interval |
| **No MiPulse indicator** — Spec says "weather of the block" — ambient community health. Not visualized. | Low (spec) | Medium — calculate from recent activity counts + display as color/number |
| **No personalization** — Shows same sections regardless of user's interests/paths/role. | Low | Hard — weight sections by user's activity patterns |

---

## OFFLINE — Currently 3/10

### What works
- Dexie DB schema with 7 tables
- Outbox enqueue/dequeue functions
- Sync engine that processes outbox on `online` event
- `executeWithOfflineFallback` wrapper
- Service worker registered in production
- Offline page at `/offline`

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **Only 1 action uses offline wrapper** — SendFlow, QuestClaim, and timer use it. But voting, proposals, attestations, surplus claims, learn progress do NOT. Most actions just fail offline. | Critical (spec: "Works when internet fails") | Medium — wrap every server action call with `executeWithOfflineFallback` |
| **No cached pages** — SW caches API responses but not page shells. If offline and you navigate, you get the `/offline` fallback for every route. | High | Medium — pre-cache critical page shells (/wallet, /learn, /safety) |
| **No offline data hydration** — Dexie has cache functions (`cacheProfileData`, `cacheWalletData`, `cacheResources`) but nothing calls them. Data is never cached for offline viewing. | High | Medium — call cache functions after each successful page load |
| **Background sync not implemented** — SW has no `sync` event handler. Even when online returns, only the in-page JS replays — if app is closed, nothing syncs. | Medium | Medium — add `sync` event in SW that triggers outbox processing |
| **Outbox status not shown to user** — Pending items exist but no UI tells the user "3 actions pending." OfflineIndicator exists but never connects to the real `getPendingCount`. | Medium | Easy — wire OfflineIndicator to actually call getPendingCount from Dexie |

---

## ONBOARDING — Currently 6/10

### What works
- 3-step wizard (name → neighborhood → welcome)
- Profile update with `onboarding_complete: true`
- Redirects to `/home` after completion
- Home page redirects back to `/onboarding` if not complete

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **Welcome reward not claimed** — Server action `completeOnboarding` auto-claims 50 $MLY welcome bonus. But the page uses raw Supabase update instead of this action, so welcome bonus is skipped. | High (users miss their first $MLY) | Easy — replace raw Supabase call with `completeOnboarding` server action |
| **No avatar upload step** — User has to go to profile later to upload an avatar. Should be part of onboarding. | Medium | Easy — add step between name and neighborhood |
| **No Mi introduction** — Spec says Mi introduces itself during onboarding. Currently no Mi awareness. | Medium | Medium — add a step where Mi sends a welcome message and shows capabilities |
| **No interest selection** — Spec mentions choosing interests to personalize the experience. | Low | Easy — add multi-select for topics (governance, food, repair, etc.) stored in profile.metadata |
| **Steps not URL-persistent** — If you refresh on step 2, you're back to step 1. No URL state or localStorage. | Low | Easy — use `nuqs` (installed) for URL-based step tracking |

---

## SHELL — Currently 7/10

### What works
- Sidebar with all routes (desktop)
- Bottom nav with 5 tabs (mobile)
- Notification bell with real-time subscription
- Mi bubble (floating + drawer)
- Command search (Cmd+K, multi-table)
- Offline indicator (UI exists)
- Service worker registration

### What's missing for Level 10

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| **Search results don't handle empty query well** — Shows "No results" immediately on open before typing. Should show recent/suggested. | Low | Easy — show suggested pages or recent searches when query is empty |
| **No dark mode toggle** — App respects system preference but no manual toggle in UI. | Low | Easy — add toggle in profile settings, persist in localStorage |
| **Notification bell has no "mark all read"** — Individual notifications can be marked but no bulk action. | Low | Easy — add button that calls `markAllNotificationsRead` server action |
| **No breadcrumbs** — Deep pages (governance/[id], learn/[slug]/[module]) have manual "← Back" buttons but no proper breadcrumb trail. | Low | Easy — add Breadcrumb component using pathname segments |

---

## TOTAL GAPS TO LEVEL 10: 62

**Critical (feature doesn't fulfill its purpose without this):** 8  
**High (real users would complain immediately):** 20  
**Medium (noticeable, affects quality):** 24  
**Low (polish, delight, spec compliance):** 10

### Top 10 Priority Fixes (Most Impact per Effort)

1. **Atomic wallet transaction** — single RPC function for transfer (prevents money loss)
2. **Server-side timer escalation** — cron/edge function that actually notifies contacts
3. **Image upload in street listings** — marketplace is useless without photos
4. **Listing detail page** — can't buy/contact from browse view
5. **Wire ALL actions through offline wrapper** — spec says "works when internet fails"
6. **Proposal auto-close cron** — expired proposals stay open forever
7. **Onboarding uses server action** — claims welcome reward properly
8. **Mi cloud fallback** — Mi is dead without local Ollama
9. **Transaction pagination** — shows max 20, no way to see more
10. **Module content for remaining 9 paths** — only Rights path has content
