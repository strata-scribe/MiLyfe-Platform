# MiLyfe — Sovereign Infrastructure Design

**What this is:** The plan to replace every corporate dependency with community-owned infrastructure. Not for day one — built as we scale. But designed from day one so nothing is a surprise.

**Principle:** The platform must survive the shutdown of any single company. Vercel, Supabase, GitHub — if any of them disappears tomorrow, MiLyfe keeps running within 48 hours.

---

## Current State → Target State

| Dependency | Current | Sovereign Replacement | License | Trigger to Migrate |
|---|---|---|---|---|
| **Hosting/Deploy** | Vercel | Coolify on Hetzner | MIT | >$200/month Vercel bill OR 50K users |
| **Database + Auth + Realtime** | Supabase Cloud | Self-hosted Supabase on K3s | Apache-2.0 | >$100/month Supabase bill OR data sovereignty mandate |
| **Git + CI/CD** | GitHub + Actions | Forgejo + Woodpecker CI | MIT / Apache-2.0 | Community vote OR GitHub policy change |
| **DNS** | Cloudflare | Self-managed + Cloudflare (dual) | N/A | Never fully migrate DNS — dual-provider for resilience |
| **Object Storage** | Supabase Storage | MinIO on Hetzner | AGPL-3.0 | With Supabase self-hosting |
| **Secrets Management** | Vercel Env Vars | OpenBao (Vault fork) | MPL-2.0 | With K3s deployment |
| **Monitoring** | None (planned Sentry) | OpenObserve + GlitchTip | Apache-2.0 / MIT | Day one of self-hosting |
| **Security** | Basic headers | CrowdSec + Wazuh | MIT / GPL-2.0 | First 1K users |
| **Search** | Meilisearch (Docker) | Same (already self-hosted) | MIT | Already sovereign |
| **Cache** | Redis (Docker) | Same (already self-hosted) | BSD-3 | Already sovereign |
| **Email** | Mailpit (Docker) | Stalwart Mail Server | AGPL-3.0 | Production email needed |
| **AI Inference** | LiteLLM (Docker) | Same + Ollama cluster | MIT | Already sovereign |
| **Analytics** | Umami (Docker) | Same (already self-hosted) | MIT | Already sovereign |

---

## Phase 1: The Escape Hatch (Build Now, Use Later)

**Goal:** Every service has an export path and a self-hosted config ready. Even while using managed services.

### 1.1 — Supabase Export-Ready

The app already uses `@supabase/ssr` which talks to any Supabase-compatible endpoint. The only change needed to self-host is swapping the URL and keys in environment variables.

**What to build now:**
- `docker-compose.supabase.yml` — Full self-hosted Supabase stack (Postgres, GoTrue auth, Realtime, Storage, PostgREST, Kong gateway)
- Migration scripts that work against any Postgres (not Supabase-specific)
- Backup cron that exports DB daily to encrypted S3-compatible storage
- Test that the app works against a local Supabase Docker instance

**Open-source stack (all Apache-2.0 or MIT):**
- PostgreSQL 16 — the actual database
- GoTrue — authentication (what Supabase Auth is built on)
- PostgREST — auto-generated REST API from Postgres schema
- Supabase Realtime — WebSocket subscriptions
- Supabase Storage — S3-compatible object storage
- Kong — API gateway routing

### 1.2 — Vercel-Independent Build

The app is standard Next.js. It can run on any Node.js host. Vercel is just a deployment target.

**What to build now:**
- `Dockerfile` — Multi-stage build for the Next.js app (standalone output)
- `docker-compose.yml` — Full local development stack (app + Supabase + services)
- `coolify.json` — Coolify deployment config (one-click self-host)
- Document the standalone build: `next build && next start` on any Linux box

**Coolify ([github.com/coollabsio/coolify](https://github.com/coollabsio/coolify), Apache-2.0):**
- Git-push-to-deploy (same DX as Vercel)
- Automatic SSL via Let's Encrypt
- Preview deployments per branch
- Resource monitoring dashboard
- Runs on a single $20/month Hetzner VPS
- Supports Docker, Docker Compose, and Nixpacks builds

### 1.3 — GitHub-Independent Code

**What to build now:**
- Mirror to Forgejo on Codeberg (free, community-run) as a live backup
- Forgejo Actions workflow files (compatible with GitHub Actions syntax with minor tweaks)
- Document the full self-hosted CI/CD stack

**Forgejo ([forgejo.org](https://forgejo.org), MIT):**
- 100MB RAM footprint (vs GitLab's 4-8GB)
- Issues, PRs, wiki, packages, container registry
- Forgejo Actions — GitHub Actions-compatible CI runner
- Federation support (instances can discover each other)
- Hosted by a nonprofit (Codeberg e.V.) — no company can revoke governance

**Woodpecker CI ([woodpecker-ci.org](https://woodpecker-ci.org), Apache-2.0):**
- Container-native pipelines
- Integrates directly with Forgejo via webhooks
- Every step runs in isolation (Docker containers)
- Multi-platform builds (ARM + x86)
- Secrets management built in

---

## Phase 2: The Sovereign Stack (Deploy When Scale Demands)

**Trigger:** Community vote OR >$300/month combined managed costs OR data sovereignty requirement.

### 2.1 — Infrastructure Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    HETZNER CLOUD (EU)                         │
│  Why: Cheapest reliable cloud. GDPR-native. No US CLOUD Act. │
│  Cost: 3-node K3s cluster = ~$45/month                       │
│  Location: Helsinki (EU data residency)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  K3s Node 1 │  │  K3s Node 2 │  │  K3s Node 3 │        │
│  │  (control)  │  │  (worker)   │  │  (worker)   │        │
│  │  CX32: 4CPU │  │  CX32: 4CPU │  │  CX32: 4CPU │        │
│  │  8GB RAM    │  │  8GB RAM    │  │  8GB RAM    │        │
│  │  80GB NVMe  │  │  80GB NVMe  │  │  80GB NVMe  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│                ┌─────────┴─────────┐                        │
│                │   Hetzner LB      │                        │
│                │   (Layer 4 TCP)   │                        │
│                └───────────────────┘                        │
│                          │                                   │
│                   TRAEFIK INGRESS                            │
│                   (auto-SSL, routing)                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Provisioning:** [hetzner-k3s](https://github.com/vitobotta/hetzner-k3s) (MIT) — Creates production HA clusters in 2-3 minutes. No Terraform knowledge needed.

**Infrastructure as Code:** OpenTofu ([github.com/opentofu/opentofu](https://github.com/opentofu/opentofu), MPL-2.0) — Terraform fork that's truly open source. Hetzner provider included.

### 2.2 — Application Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    K3s CLUSTER                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  COMPUTE                         DATA                        │
│  ┌──────────────┐               ┌──────────────┐           │
│  │ MiLyfe App   │               │ PostgreSQL 16│           │
│  │ (Next.js)    │──────────────▶│ (Primary)    │           │
│  │ 2 replicas   │               │ + Streaming  │           │
│  └──────────────┘               │   Replica    │           │
│  ┌──────────────┐               └──────────────┘           │
│  │ GoTrue       │               ┌──────────────┐           │
│  │ (Auth)       │               │ Redis 7      │           │
│  └──────────────┘               │ (Cache+Queue)│           │
│  ┌──────────────┐               └──────────────┘           │
│  │ PostgREST    │               ┌──────────────┐           │
│  │ (REST API)   │               │ MinIO        │           │
│  └──────────────┘               │ (S3 Storage) │           │
│  ┌──────────────┐               └──────────────┘           │
│  │ Realtime     │               ┌──────────────┐           │
│  │ (WebSocket)  │               │ Meilisearch  │           │
│  └──────────────┘               │ (Search)     │           │
│  ┌──────────────┐               └──────────────┘           │
│  │ Coolify      │                                           │
│  │ (Deploy UI)  │                                           │
│  └──────────────┘                                           │
│                                                              │
│  SERVICES                        OPS                         │
│  ┌──────────────┐               ┌──────────────┐           │
│  │ Forgejo      │               │ OpenObserve  │           │
│  │ (Git+Issues) │               │ (Logs/Traces)│           │
│  └──────────────┘               └──────────────┘           │
│  ┌──────────────┐               ┌──────────────┐           │
│  │ Woodpecker   │               │ GlitchTip    │           │
│  │ (CI/CD)      │               │ (Errors)     │           │
│  └──────────────┘               └──────────────┘           │
│  ┌──────────────┐               ┌──────────────┐           │
│  │ Ollama       │               │ CrowdSec     │           │
│  │ (AI Models)  │               │ (WAF/IPS)    │           │
│  └──────────────┘               └──────────────┘           │
│  ┌──────────────┐               ┌──────────────┐           │
│  │ Stalwart     │               │ Umami        │           │
│  │ (Email)      │               │ (Analytics)  │           │
│  └──────────────┘               └──────────────┘           │
│  ┌──────────────┐               ┌──────────────┐           │
│  │ LiveKit      │               │ OpenBao      │           │
│  │ (Video/Call) │               │ (Secrets)    │           │
│  └──────────────┘               └──────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 — Cost Comparison

| Scale | Vercel + Supabase + GitHub | Sovereign (Hetzner K3s) |
|---|---|---|
| 100 users | $0 (free tiers) | $0 (stay on managed) |
| 1,000 users | ~$25/month | $0 (stay on managed) |
| 10,000 users | ~$200-500/month | ~$45/month (3 nodes) |
| 50,000 users | ~$800-2000/month | ~$90/month (6 nodes) |
| 100,000 users | ~$3000-5000/month | ~$150/month (9 nodes) |

**The crossover point is ~5,000-10,000 monthly active users.** Below that, managed services are cheaper in ops time. Above that, self-hosting saves 10-50x.

---

## Phase 3: The MiCloud (MiLyfe As Its Own Platform)

**This is the endgame.** MiLyfe doesn't just self-host — it becomes a hosting platform that communities can deploy with one command.

### 3.1 — MiCloud Service Map

These are the internal service names. Members never see them.

| Service | What It Does | Open Source Engine | License |
|---|---|---|---|
| **MiCompute** | Container orchestration | K3s | Apache-2.0 |
| **MiBase** | SQL database | PostgreSQL 16 | PostgreSQL License |
| **MiPulse** | Real-time subscriptions | Supabase Realtime | Apache-2.0 |
| **MiFlash** | Cache + message queue | Redis 7 / Valkey | BSD-3 / BSD-3 |
| **MiFind** | Full-text search | Meilisearch | MIT |
| **MiGate** | API gateway + SSL | Traefik | MIT |
| **MiQueue** | Background jobs | NATS JetStream | Apache-2.0 |
| **MiSignal** | WebSocket pub/sub | Supabase Realtime | Apache-2.0 |
| **MiWatch** | Logs, metrics, traces | OpenObserve | AGPL-3.0 |
| **MiShield** | WAF + threat detection | CrowdSec | MIT |
| **MiVault** | Secrets + encryption | OpenBao | MPL-2.0 |
| **MiGit** | Code hosting + CI | Forgejo + Woodpecker | MIT / Apache-2.0 |
| **MiDeploy** | Push-to-deploy platform | Coolify | Apache-2.0 |
| **MiMail** | Transactional + inbox | Stalwart | AGPL-3.0 |
| **MiBrain** | AI model serving | Ollama + LiteLLM | MIT / MIT |
| **MiCall** | Video/voice rooms | LiveKit | Apache-2.0 |
| **MiStore** | S3-compatible objects | MinIO | AGPL-3.0 |
| **MiBackup** | Encrypted daily backups | Restic + MinIO | BSD-2 |
| **MiDNS** | DNS resolution | CoreDNS | Apache-2.0 |
| **MiMetrics** | Uptime + performance | OneUptime | Apache-2.0 |

### 3.2 — Mesh-in-a-Box (Community Deployment)

The ultimate expression: a community buys hardware, runs one command, and has their own MiLyfe instance that federates with others.

```
┌─────────────────────────────────────────────────┐
│             MiLyfe MESH-IN-A-BOX                 │
│                                                  │
│  Hardware: Any x86/ARM64 with 8GB RAM            │
│  OS: Debian/Ubuntu (auto-provisioned)            │
│  One command: curl -sL mi.run/install | bash     │
│                                                  │
│  What you get:                                   │
│  ✓ Full MiLyfe platform (all 14+ routes)        │
│  ✓ Local database (your data stays local)       │
│  ✓ AI helpers (Ollama with 3B model)            │
│  ✓ Federation (connects to other instances)     │
│  ✓ Mesh relay (ESP32 nodes connect)             │
│  ✓ Automatic updates (community-signed)         │
│  ✓ Backup to peer instances (encrypted)         │
│                                                  │
│  Monthly cost: electricity only (~$5-10)         │
└─────────────────────────────────────────────────┘
```

### 3.3 — Federation Protocol

Multiple MiLyfe instances communicating:

```
┌──────────────┐     Federation     ┌──────────────┐
│  Jacksonville│◄───────────────────►│  Atlanta     │
│  Instance    │                     │  Instance    │
│              │     What travels:   │              │
│  - Profiles  │     • Standing      │  - Profiles  │
│  - $MLY      │       (cooling)     │  - $MLY      │
│  - Forums    │     • Profile       │  - Forums    │
│  - Governance│       (portable)    │  - Governance│
│              │     • Messages      │              │
│              │       (E2EE)        │              │
│              │     • Marketplace   │              │
│              │       (cross-list)  │              │
│              │                     │              │
│              │     What stays:     │              │
│              │     • Ballots       │              │
│              │     • Local law     │              │
│              │     • Treasury      │              │
│              │     • Child reports │              │
└──────────────┘                     └──────────────┘
```

**Protocol:** ActivityPub for social federation (compatible with Mastodon/Threads), custom MiLyfe protocol for $MLY transfers and standing portability.

---

## Phase 4: The Custom Blockchain (If Community Votes For It)

**This is NOT automatic.** The community votes to activate this. Until then, PostgreSQL is the ledger.

### 4.1 — Why Postgres First, Chain Later

| Criteria | Postgres | Custom Chain |
|---|---|---|
| Speed | Instant | 1-6 seconds per block |
| Cost per tx | $0 | Gas (even if tiny) |
| Privacy | Full RLS | Public by default |
| Reversibility | Easy (admin can fix errors) | Hard (immutable) |
| Complexity | 1 service | 5+ services (consensus, mempool, indexer, RPC, explorer) |
| Suitable when | <100K users, internal credits | >100K users, external convertibility, multi-instance |

**The chain activates when:**
1. Community votes to open external $MLY convertibility
2. Multiple federated instances need consensus on cross-instance transfers
3. Legal counsel confirms the chain design doesn't create securities liability

### 4.2 — Chain Architecture (When Activated)

**NOT Ethereum/Solana/etc.** A purpose-built chain for community credits.

| Component | Choice | Why |
|---|---|---|
| Consensus | Tendermint/CometBFT | Fast finality, validator rotation, proven |
| Smart contracts | CosmWasm (Rust) | Deterministic, upgradeable, auditable |
| Token standard | CW-20 (Cosmos) | Simple transfers, no DeFi complexity |
| Identity | DID:key on-chain | Portable, no phone-number dependency |
| Governance | On-chain proposals | Transparent, auditable, automated execution |
| Bridge to SQL | Custom indexer | So the app still reads from Postgres (fast) |
| Explorer | Custom (not Etherscan) | Shows human-readable actions (MiReceipt) |
| Validator set | Rotating keepers | No permanent validators. Standing-weighted selection. |

**Members never see:**
- Block numbers, gas, validators, consensus, chain ID, RPC endpoints
- "Approve token spending" popups
- Wallet addresses (0x...)
- Transaction hashes

**Members see:**
- "Your share arrived" (same as today)
- "You thanked Maria 12" (same as today)
- "This thanks is walking" (offline, settling when connected)

The chain is invisible plumbing. The app doesn't change.

### 4.3 — Chain GitHub Repos (When Built)

| Repo | Purpose |
|---|---|
| `MiLyfe-Chain` | CometBFT node + CosmWasm contracts |
| `MiLyfe-Chain-Indexer` | Reads blocks → writes to Postgres for app |
| `MiLyfe-Chain-Explorer` | Human-readable block explorer (MiReceipt format) |
| `MiLyfe-Chain-SDK` | TypeScript SDK for app integration |

---

## GitHub Multi-Repo Architecture (Build as Scaling)

| Repo | Purpose | When to Create |
|---|---|---|
| `MiLyfe-Platform` | Core web app (Next.js) | **EXISTS NOW** |
| `MiLyfe-Infrastructure` | OpenTofu configs, K3s manifests, Docker Compose stacks | When first self-hosting |
| `MiLyfe-AI` | Helper personalities, RAG pipeline, function-calling schemas, ring routing | When AI system built |
| `MiLyfe-Mesh` | Offline CRDT engine, DTN transport, ESP32 firmware | When mesh built |
| `MiLyfe-Coordination` | MiAction, MiScope, MiReceipt, MiWalk, MiStage (Temporal + OPA) | When coordination layer built |
| `MiLyfe-Media` | PeerTube, AzuraCast, content pipeline configs | When media stack deployed |
| `MiLyfe-Mobile` | React Native / Capacitor native wrapper | When native app needed |
| `MiLyfe-Dev-Portal` | Developer APIs, SDKs, app store, webhook system | When dev ecosystem opens |
| `MiLyfe-Chain` | Custom blockchain (if voted) | If/when community activates |
| `MiLyfe-Docs` | Architecture docs, API reference, contributor guides | Now (split from platform) |
| `MiLyfe-Design` | Figma exports, design system tokens, component specs | When design system matures |
| `MiLyfe-Legal` | Law packs (OPA policies), entity kit templates, compliance docs | When legal framework built |
| `MiLyfe-Box` | Mesh-in-a-box installer, community deployment scripts | When federation ready |

---

## Migration Playbook (When Each Trigger Hits)

### Trigger: >$200/month Vercel bill

```
1. Provision 3 Hetzner CX32 nodes (~$45/month total)
2. Run: hetzner-k3s create --config milyfe-cluster.yaml
3. Deploy Coolify to node 1
4. Connect Coolify to Forgejo (or GitHub mirror)
5. Deploy Next.js app via Coolify
6. Update DNS: milyfe-platform.vercel.app → mi.lyfe (or whatever domain)
7. Keep Vercel as preview-deploy only (free tier)
8. Total downtime: 0 (DNS cutover)
```

### Trigger: Supabase sovereignty needed

```
1. On the same K3s cluster, deploy Supabase self-hosted stack
2. Run: supabase db dump from cloud → restore to self-hosted Postgres
3. Migrate auth users (GoTrue export/import)
4. Update NEXT_PUBLIC_SUPABASE_URL to self-hosted endpoint
5. Verify: auth, realtime, storage all work
6. Keep Supabase Cloud as read-replica/backup for 30 days
7. Cut over fully
```

### Trigger: GitHub independence

```
1. Deploy Forgejo on K3s cluster
2. Mirror all repos: gh repo list RealMiLyfe --json name | forgejo migrate
3. Set up Woodpecker CI connected to Forgejo
4. Port GitHub Actions → Woodpecker pipeline YAML (95% compatible syntax)
5. Move issues: gh issue list → forgejo issue create (scripted)
6. Update CONTRIBUTING.md to point to Forgejo
7. Keep GitHub as public mirror (read-only) for visibility
8. Development happens on Forgejo; GitHub syncs daily
```

---

## The $0 → Sovereign Cost Curve

```
Month 1-6:     $0/month (all free tiers — Vercel, Supabase, GitHub)
Month 6-12:    $0/month (still within free tier at <1K users)
Month 12-18:   ~$25/month (Supabase Pro if needed)
Month 18-24:   ~$45-90/month (self-hosted on 3-6 Hetzner nodes)
Month 24+:     ~$90-150/month (full sovereign stack, 50K+ users)
                Community-funded from $MLY treasury (voted allocation)
```

**Who pays:** The community treasury (place pot) allocates for infrastructure via governance vote. This is a legitimate community expense — same as any co-op paying for hosting.

---

## What This Means for the Build Today

1. **Keep using Vercel/Supabase/GitHub.** They're free, they work, they let you focus on the product.
2. **Write the `Dockerfile` and `docker-compose.yml` now** — so the escape hatch exists.
3. **Never use Vercel-specific features** (Edge Config, KV, Blob) — stay on standard Next.js APIs.
4. **Never use Supabase-specific features** beyond the OSS stack (Auth, Realtime, Storage, PostgREST are all open source).
5. **Keep all data exportable** — `pg_dump` is your sovereignty guarantee.
6. **Mirror to Codeberg** — free, community-governed Forgejo instance. Backup if GitHub changes policy.
7. **Document everything** — So a new ops person can stand up the sovereign stack from docs alone.

The architecture is: **corporate convenience now, sovereign independence whenever the community decides.** No lock-in. No surprises. No rewrite needed.

---

## Open Source Foundation Register

Every service above is OSI-licensed. No BSL, no SSPL, no Commons Clause, no "open core with essential features paywalled."

| Project | License | Verified |
|---|---|---|
| K3s | Apache-2.0 | ✓ |
| OpenTofu | MPL-2.0 | ✓ |
| PostgreSQL | PostgreSQL License (permissive) | ✓ |
| Supabase (self-hosted) | Apache-2.0 | ✓ |
| Forgejo | MIT | ✓ |
| Woodpecker CI | Apache-2.0 | ✓ |
| Coolify | Apache-2.0 | ✓ |
| Traefik | MIT | ✓ |
| MinIO | AGPL-3.0 | ✓ |
| OpenBao | MPL-2.0 | ✓ |
| CrowdSec | MIT | ✓ |
| OpenObserve | AGPL-3.0 | ✓ |
| GlitchTip | MIT | ✓ |
| Stalwart Mail | AGPL-3.0 | ✓ |
| Ollama | MIT | ✓ |
| LiteLLM | MIT | ✓ |
| LiveKit | Apache-2.0 | ✓ |
| Meilisearch | MIT | ✓ |
| Redis/Valkey | BSD-3 | ✓ |
| NATS | Apache-2.0 | ✓ |
| CometBFT | Apache-2.0 | ✓ |
| CoreDNS | Apache-2.0 | ✓ |
| Restic | BSD-2-Clause | ✓ |
| Umami | MIT | ✓ |

**Every project here can be forked, self-hosted, and modified without asking permission.** That's the point.

---

*The platform belongs to the people who use it. The infrastructure belongs to the community that runs it. No single company can take it away.*
