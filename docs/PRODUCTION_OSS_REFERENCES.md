# Production Open-Source References — Free, No Signup, MIT/Apache

**Date:** 24 August 2026  
**Purpose:** Map every MiLyfe feature to a production-grade OSS repo we can learn from, reference, or integrate directly. All free. All public GitHub. No premium tiers needed.

---

## Tier 1: Full Production Apps to Study & Steal Patterns From

### 1. Vercel AI Chatbot (vercel/chatbot)
- **GitHub:** [github.com/vercel/chatbot](https://github.com/vercel/chatbot)
- **License:** MIT
- **Relevance:** Mi helper — streaming, function calling, tool results, message persistence, generative UI
- **What to take:**
  - Streaming chat with `useChat` hook pattern
  - Function calling with tool result rendering inline
  - Message persistence to database
  - Multi-model support
  - File/image attachments in chat
  - Generative UI (React Server Components streamed as chat responses)

### 2. assistant-ui (assistant-ui/assistant-ui)
- **GitHub:** [github.com/assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui)
- **License:** MIT
- **Relevance:** Mi chat components — production-ready primitives for AI chat
- **What to take:**
  - `@assistant-ui/react` — composable chat primitives (Thread, Message, Composer, Tool)
  - Works with Vercel AI SDK out of the box
  - Tool UI components (approvals, forms, tables in chat)
  - Markdown rendering with code highlighting
  - Branching conversations
  - **Can install directly: `npm install @assistant-ui/react`**

### 3. assistant-ui/tool-ui
- **GitHub:** [github.com/assistant-ui/tool-ui](https://github.com/assistant-ui/tool-ui)
- **License:** MIT
- **Relevance:** When Mi calls functions, render tool results as interactive cards
- **What to take:**
  - Approval cards (confirm/reject before tool executes)
  - Data tables from tool responses
  - Media cards
  - Form fills from AI suggestions

### 4. Kiranism/next-shadcn-dashboard-starter
- **GitHub:** [github.com/Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
- **License:** MIT
- **Relevance:** Production dashboard patterns — tables, forms, kanban, auth, billing
- **What to take:**
  - TanStack Table with server-side search/pagination/sort (for transaction history, quest lists)
  - TanStack Form + Zod validation (or react-hook-form equivalent patterns)
  - Kanban board with dnd-kit (for Learn progress, quest status boards)
  - Notification system patterns
  - Feature-based folder structure
  - Multi-theme support

### 5. shadcn-fintech (abderrahimghazali/shadcn-fintech)
- **GitHub:** [github.com/abderrahimghazali/shadcn-fintech](https://github.com/abderrahimghazali/shadcn-fintech)
- **License:** MIT
- **Relevance:** Wallet/Pocket UI — fintech dashboard with interactive cards
- **What to take:**
  - Animated balance cards with gradients
  - Transaction history with filters and categories
  - Spending heatmap (adapt for $MLY flow visualization)
  - Live ticker (adapt for MiPulse — community activity)
  - Drag-and-drop layout (adapt for jar management)
  - Interactive chart components

### 6. guillermoscript/lms-front
- **GitHub:** [github.com/guillermoscript/lms-front](https://github.com/guillermoscript/lms-front)
- **License:** MIT
- **Relevance:** Learn tab — full LMS with Next.js + Supabase + AI tutor
- **What to take:**
  - Course/module content rendering
  - Student progress tracking
  - AI tutor integration (MCP-based — very close to our Mi + Learn)
  - Gamification (badges, streaks, XP)
  - Certificate generation (adapt for Open Badges)
  - Multi-tenant architecture (adapt for federation)
  - Exam/quiz system with grading
  - i18n (en/es — matches our multi-language need)

### 7. OneStopShop (jackblatch/OneStopShop)
- **GitHub:** [github.com/jackblatch/OneStopShop](https://github.com/jackblatch/OneStopShop)
- **License:** MIT
- **Relevance:** Street marketplace — full CRUD with Next.js App Router
- **What to take:**
  - Product creation with image upload
  - Seller profiles
  - Server actions for all mutations
  - Parallel routes + intercepting routes for modals
  - Shopping cart (adapt for quest claiming)
  - Payment flow (adapt for $MLY checkout)

### 8. shadcn-ui/taxonomy
- **GitHub:** [github.com/shadcn-ui/taxonomy](https://github.com/shadcn-ui/taxonomy)
- **License:** MIT
- **Relevance:** App architecture patterns — auth, subscriptions, MDX content
- **What to take:**
  - Next.js app router architecture
  - MDX content rendering (for Learn modules)
  - Authentication patterns
  - Dashboard layout
  - Command menu (adapt for global Mi/search)

---

## Tier 2: Component Libraries & Utilities to Install Directly

### 9. Vercel AI SDK (`ai` package)
- **NPM:** `npm install ai @ai-sdk/openai`
- **GitHub:** [github.com/vercel/ai](https://github.com/vercel/ai)
- **Use for:** Mi streaming, `useChat` hook, function calling, tool definitions
- **Key features:** `streamText`, `generateText`, `tool()`, `useChat`, multi-provider

### 10. react-hook-form + zod (already installed, unused)
- **Use for:** Every form in the app
- **Pattern:** `useForm<z.infer<typeof schema>>` + `zodResolver(schema)` + `<FormField>` shadcn components

### 11. framer-motion (already installed, unused)
- **Use for:** Page transitions, balance animations, celebrations, list reordering
- **Key patterns:** `AnimatePresence`, `motion.div`, `useSpring` for number animations, `layoutId` for shared transitions

### 12. maplibre-gl (already installed, unused)
- **NPM:** Already in deps
- **Use for:** Street map view, resource pins, quest locations, surplus pickup

### 13. meilisearch (already installed, unused)
- **NPM:** Already in deps
- **Use for:** Global search, street search, resource discovery

### 14. tiptap (already installed, unused)
- **NPM:** Already in deps
- **Use for:** Rich text in proposals, forum posts, wiki editing, class content

### 15. dexie + dexie-react-hooks (already installed)
- **NPM:** Already in deps + offline lib already built
- **Use for:** Offline wallet cache, learn content, resource cache, outbox

### 16. recharts (already installed)
- **NPM:** Already in deps
- **Use for:** Standing radar/bar charts, transaction visualizations, MiPulse activity

---

## Tier 3: Specific Feature References

### Safety & Emergency
| Need | Reference | Notes |
|------|-----------|-------|
| Encrypted notes | Signal Protocol patterns | AES-GCM client-side, server stores ciphertext |
| Walk-home timer | Find My Friends (Apple) UX | Server-side timer + push notification |
| Witness mode | Voice Memos UX + MediaRecorder API | Stream to encrypted storage |
| Push notifications | web-push npm package | VAPID keys, Supabase Edge Function trigger |

### Governance & Voting
| Need | Reference | Notes |
|------|-----------|-------|
| Proposal lifecycle | Decidim UX flow | 5-stage state machine (already designed) |
| Discussion threads | GitHub Discussions / Reddit | Threaded comments with voting |
| Delegation | Liquid democracy academic papers | Graph traversal with cycle detection (already designed) |
| Live vote counts | Supabase Realtime `postgres_changes` | Subscribe to votes table |

### Maps & Location
| Need | Reference | Notes |
|------|-----------|-------|
| Map integration | [maplibre.org examples](https://maplibre.org/maplibre-gl-js/docs/examples/) | Markers, popups, clusters |
| Geocoding | Nominatim (OSM) — free, no key | Address → coordinates |
| Route display | OSRM (routing) or MapLibre directions | Walking routes for walk-home |

---

## Integration Strategy

**Don't reinvent. Don't fork. Use directly or adapt patterns.**

| Our Feature | Primary Reference | Install or Study? |
|------------|-------------------|-------------------|
| Mi Chat | vercel/chatbot + assistant-ui/react | **Install** assistant-ui + ai package, study chatbot patterns |
| Mi Tool Results | assistant-ui/tool-ui | **Install** directly |
| Wallet UI | shadcn-fintech | **Study** patterns, adapt cards/animations |
| Learn System | guillermoscript/lms-front | **Study** course/module/progress architecture |
| Marketplace | jackblatch/OneStopShop | **Study** CRUD + server actions + image upload |
| Forms | Kiranism/dashboard-starter | **Study** TanStack Form + Zod patterns |
| Tables | Kiranism/dashboard-starter | **Study** TanStack Table with server-side ops |
| Animations | framer-motion docs + examples | **Use** directly (already installed) |
| Maps | maplibre-gl examples | **Use** directly (already installed) |
| Search | meilisearch JS client docs | **Use** directly (already installed) |
| Rich Text | tiptap docs | **Use** directly (already installed) |
| Offline | dexie docs + our existing lib | **Use** directly (already built) |

---

## What to Install Next

```bash
# AI Chat (production-grade components)
npm install @assistant-ui/react @assistant-ui/react-ai-sdk

# Vercel AI SDK (streaming + function calling)
npm install ai @ai-sdk/openai

# Web Push (safety timer notifications)  
npm install web-push

# Image upload utilities
npm install react-dropzone

# Charts (standing radar, analytics)
# recharts already installed

# Everything else is already in package.json but unused
```

---

## Execution Order (Mapped to Deep Build Phases)

| Phase | Primary OSS Reference | What We Take |
|-------|----------------------|--------------|
| 1: Foundation | react-hook-form docs + Zod | Forms pattern across all views |
| 2: Street | OneStopShop + MapLibre | CRUD modals, image upload, map pins |
| 3: Learn | lms-front + taxonomy | Module renderer, progress, assessments |
| 4: Mi | vercel/chatbot + assistant-ui | Streaming, tools, ambient bubble |
| 5: Wallet | shadcn-fintech | Animated balance, send flow, jar UI |
| 6: Governance | Decidim UX + Tiptap | Rich proposals, live voting, delegation |
| 7: Safety | web-push + MediaRecorder | Server timer, encrypted journal, witness |
| 8: Profile | Supabase storage docs | Avatar upload, radar chart, privacy |
| 9: Shell | assistant-ui bubble pattern | Mi FAB, global search, transitions |

Each phase studies the reference repo, extracts the patterns, and implements them in MiLyfe's style (Radix UI + Tailwind + Supabase backend).
