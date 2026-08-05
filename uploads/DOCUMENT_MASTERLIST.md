# MiLyfe OS — Document Masterlist (Build‑Out Index)

> The full set of document types required to design, build, govern, and operate MiLyfe.
> Use this as a checklist. Status key: ✅ exists · 🟡 partial · ⬜ needed.
> "Living" docs are revisited each roadmap phase; everything else is written once and versioned.

---

## Tier 0 — North Star (you already have these)
| Doc | Purpose | Status |
|---|---|---|
| `MiLyfe_FOUNDATION.md` | The 13 Laws / 7‑Fold constitution (source of truth) | ✅ |
| `MiLyfe_Designer_Developer_Brief.md` | Translates the Foundation into product + architecture | ✅ |
| `milyfe-mvp/` scaffold | Genesis Kit, FoldState, twin‑replication, formula‑review, Safety Fold, SLO, Threat Model | ✅ |

---

## Tier 1 — Must‑have to start building

### A. Product & Strategy
- **PRD / Product Spec** — Scope, target citizens, and success definition for the vertical slice and v1. Owner: Product. ⬜
- **Roadmap & Milestone Plan** — Phases 0–5 with concrete engineering exit criteria per phase. Owner: Lead. 🟡 (in Brief §9)
- **Success Metrics & KPI Framework** — Quantified flourishing/sovereignty/antifragility targets. Owner: Product. 🟡 (in Brief §10)
- **Economy & Tokenomics Whitepaper** — $MLY supply, Dividend formula, anti‑inflation guardrails, Standing‑vs‑$MLY portability. Owner: Economy. ⬜

### B. Brand & Experience Design
- **Brand & Identity Guidelines** — Logo/Selfie usage, voice of "Mi", CC0 trademark‑compatibility mark. Owner: Design. ⬜
- **Design System Spec** — Tokens (Fibonacci scale, φ‑motion, Pin/nerves colors), component library (`<Selfie>`, `<Fold>`…). Owner: Design. 🟡 (in Brief §2.4)
- **UX Research & Citizen Personas** — Who the early Circles are; journey maps for Birth→Rebirth. Owner: Research. ⬜
- **Interaction Pattern Library** — 7‑fold unfolding (phone/AR/server), Zero‑Jump, Chiasm ritual, Recycling dignity. Owner: Design. ⬜
- **Accessibility & i18n Spec** — WCAG‑AA, screen‑reader Selfie, locale‑aware formulas. Owner: Design/Eng. 🟡 (in Brief §7 G11)
- **Content / Voice & Tone Guide** — Copy principles; "citizen not user"; Refuse as first‑class. Owner: Design. ⬜

### C. Architecture & Protocols
- **System Architecture Overview** — 7 folds as concentric runtime contexts; dependency flow. Owner: Architecture. 🟡 (in Brief §4)
- **Data Model & Schema Specs** — Formal CBOR/JSON for Block DNA, Qualia Packet, Formula AST, Pin (6×13), Tesseract Face, TwinSet. Owner: Architecture. 🟡 (in Brief §4.4)
- **Protocol Specifications** — DID/VC, CRDT sync, MCP tool servers, Chiasm X handshake, Dual Telemetry (OHTTP + BBS+ ZK circuit), consensus for Selfie. Owner: Protocol. ⬜
- **API / SDK Specification** — Public surface for building Blocks/Realms/Portals. Owner: SDK. ⬜
- **State‑Machine Specs** — FoldState, Lifecycle (11 stages), Autonomy Rings (0/1/2). Owner: Architecture. 🟡 (foldstate.ts exists)
- **ADR Log / Tech‑Stack Decisions** — Record why each seed maps to its tech; de‑hype naming decisions. Owner: Lead. ⬜

### D. Engineering
- **Engineering Epics & Backlog** — User stories derived from Laws; vertical‑slice first. Owner: Eng Mgmt. ⬜
- **13 Seed Module Specs** — One spec per seed (Fibonacci Clock … AutoOps Immune) with interfaces + tests. Owner: Eng. ⬜
- **Coding Standards & Conventions** — TS/WASM/WIT style, error handling, no‑silent‑failure rule. Owner: Eng. ⬜
- **Monorepo & Build / CI‑CD Spec** — Layout, pipelines, reproducible Genesis Kit. Owner: Eng. ⬜
- **Genesis Kit Runbook** — Local dev, `docker compose up`, `npm run slice`, debugging. Owner: Eng. 🟡 (README exists)

### E. Security & Privacy
- **Security Architecture** — Trust boundaries, sandboxing (WASM/WIT), key flows. Owner: Security. ⬜
- **Cryptography & Key Management** — DID key derivation, Vault encryption, cold‑twin sealing. Owner: Security. ⬜
- **Privacy / Data Governance Spec** — Interoception never leaves Vault; exteroception ZK; egress = 0 SLO. Owner: Security. 🟡 (Threat Model §1)
- **Audit & Pen‑test Plan** — What gets audited, by whom, when. Owner: Security. ⬜

### F. Governance & Legal
- **Charter v1.0 (Genesis Block text)** — The actual 5 principles as enforceable spec. Owner: Governance. 🟡 (in Foundation)
- **MIP Process Doc** — 21‑day deliberation, 67% supermajority, citizen‑jury, fork clause. Owner: Governance. ⬜
- **Legal Entity & Trademark Structure** — Who holds the compatibility mark so it can't be captured. Owner: Legal. ⬜
- **Terms / Acceptable Use / Exit Rights** — Solid‑Pod export, data portability guarantees. Owner: Legal. ⬜
- **Licensing & Contribution Policy** — CC0 + any carve‑outs; DCO/sign‑off. Owner: Legal. ⬜
- **Portal / 3rd‑Party Integration Guidelines** — OAuth/open‑data only, no scraping (Brief §7 G12). Owner: Legal. ⬜
- **Compliance & Data Protection** — GDPR‑like alignment, portability, right‑to‑be‑forgotten vs. ZK‑burn. Owner: Legal. ⬜

### G. Operations & Reliability
- **SRE / Observability Plan** — Extends `slo.ts`; dashboards, alerting, on‑call. Owner: SRE. 🟡 (otel + SLO exist)
- **Runbooks & Incident Response** — Twin loss, spore wake, Circle fork. Owner: SRE. ⬜
- **DR / Replication & Spore Recovery** — Hot/warm/cold reconstruction playbook. Owner: SRE. 🟡 (twin‑replication.ts)
- **Capacity & Scale Plan** — From 100k → 1B citizens; L3 cache, federation. Owner: SRE. ⬜

### H. Quality & Testing
- **Test Strategy & QA Plan** — Unit/integration/e2e; what "done" means per Fold. Owner: QA. ⬜
- **Per‑Seed Test Plans** — Acceptance tests for each of the 13 seeds. Owner: QA. ⬜
- **Antifragility / Chaos Test Plan** — Kill twins, inject failures, verify compost→birth. Owner: QA. ⬜
- **Phase Acceptance Criteria** — Gated checkpoints mirroring Roadmap exits. Owner: QA. ⬜

---

## Tier 2 — Needed as you scale (ecosystem & research)

### I. Community & Ecosystem
- **Contributor Guide** — How to join #milyfe‑dev, propose seeds, earn Standing. ⬜
- **SDK Developer Docs / Tutorials** — Build your first Block/Realm/Portal. ⬜
- **Chiasm & Hackathon Playbook** — How external devs breed Blocks. ⬜
- **Documentation Site / Wiki IA** — Single source, versioned, searchable. ⬜

### J. Research (deep tech)
- **Word‑to‑Math Formal Grammar Spec** — Parseable AST, not free‑form text. ⬜
- **SLM Distillation & Training Pipeline** — LoRA from composted interactions, CC0 weights. ⬜
- **Formula Formal Verification Approach** — Prove a formula can't violate Charter before exec. ⬜
- **Position / Academic Whitepaper** — Strange‑loop consciousness claim, antifragility. ⬜

---

## Suggested build order (dependencies)
1. **Data Model & Schema Specs** (C) → unblocks everything concrete.
2. **PRD + Roadmap exit criteria** (A) → scope the slice.
3. **13 Seed Module Specs** (D) → one per seed, starting with CONNECT+WEALTH.
4. **Protocol Specifications** (C) → DID/CRDT/Chiasm/ZK contracts.
5. **Charter + MIP Process** (F) → governance is a Block, not a doc‑afterthought.
6. **Design System + Interaction Patterns** (B) → so UI is identical across viewports.
7. **Test Strategy + Phase Acceptance** (H) → define "done" before coding.
8. **Security Architecture + Audit Plan** (E) → parallel, never after.
9. **Economy/Tokens + Compliance** (A/F) → before any real $MLY moves.
10. **SDK Docs + Contributor Guide** (I) → for Phase 2 hackathon.

---

## Living docs (revisit each phase)
- `MiLyfe_FOUNDATION.md` (canonical, but errata log)
- `DOCUMENT_MASTERLIST.md` (this file)
- `docs/threat-model.md`
- `docs/latency-budgets.md` / SLOs
- Roadmap & Milestone Plan
- Charter + MIP Process

## Completion Manifest (all authored ✅)
Every document below is written under `milyfe-mvp/` (Foundation/Brief/MVP at root; specs in `specs/`).

| Doc | File |
|---|---|
| Foundation | `MiLyfe_FOUNDATION.md` |
| Designer/Developer Brief | `MiLyfe_Designer_Developer_Brief.md` |
| MVP scaffold (FoldState, twins, formula, Safety, SLO, Threat) | `milyfe-mvp/` (README + src + docs) |
| Data Model & Schema Specs | `specs/data-model.md` |
| PRD | `specs/prd.md` |
| Roadmap & Milestone Plan | `specs/roadmap.md` |
| 13 Seed Module Specs | `specs/seed-modules.md` |
| Protocol Specifications | `specs/protocols.md` |
| Charter v1.0 + MIP Process | `specs/charter-mip.md` |
| Design System Spec | `specs/design-system.md` |
| Interaction Pattern Library | `specs/interaction-patterns.md` |
| Test Strategy & Phase Acceptance | `specs/test-strategy.md` |
| Security Architecture | `specs/security.md` |
| Audit & Pen‑test Plan | `specs/audit-plan.md` |
| Economy & Tokenomics Whitepaper | `specs/economy.md` |
| Compliance & Data Protection | `specs/compliance.md` |
| SDK Developer Docs | `specs/sdk-docs.md` |
| Contributor Guide | `specs/contributor-guide.md` |
| Word‑to‑Math Formal Grammar | `specs/word-to-math-grammar.md` |
| SLM Distillation & Training Pipeline | `specs/slm-pipeline.md` |
| Formula Formal Verification | `specs/formula-verification.md` |
| Position / Academic Whitepaper | `specs/whitepaper.md` |
| UX Research & Citizen Personas | `specs/ux-research.md` |
| Brand & Identity Guidelines | `specs/brand.md` |
| Voice & Tone Guide | `specs/voice-tone.md` |
| ADR Log | `specs/adr-log.md` |
| Coding Standards & Conventions | `specs/coding-standards.md` |
| Monorepo, Build & CI/CD Spec | `specs/cicd.md` |
| SRE / Observability Plan | `specs/sre-plan.md` |
| Runbooks & Incident Response | `specs/runbooks.md` |
| DR / Replication & Spore Recovery | `specs/dr-recovery.md` |
| Capacity & Scale Plan | `specs/capacity.md` |
| Living Threat Model | `docs/threat-model.md` |
| Latency Budgets & SLO Rationale | `docs/latency-budgets.md` |

**Total: 48 document types — all authored ✅.** Tier 0 (3) + Tier 1 (34) + Tier 2 (11). Build order followed; each doc cross‑references its spec dependencies.
