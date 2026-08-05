# MiLyfe OS — Vertical‑Slice MVP (Genesis Kit)

> **Implements the 7 lead optimizations** from the Designer & Developer Brief:
> 1. **De‑hype internals** — "Quantum" → `twin_replication` in code (brand name kept for users).
> 2. **Single `FoldState` machine** — one source of truth for phone / AR / homeserver.
> 3. **Verify‑before‑act math** — formulas are reviewed + inspectable before they move $MLY.
> 4. **Vertical‑slice MVP** — CONNECT (1:1) + WEALTH ($MLY) inside Fold 4, before all 13 seeds.
> 5. **Latency budgets** — Zero‑Jump < 200 ms, local SLM < 500 ms, defined SLOs.
> 6. **Observability + cross‑cutting Safety Fold** — OTel from day one; Safety guards every Fold.
> 7. **Living threat model** — `docs/threat-model.md`, revisited each roadmap phase.
>
> CC0. This is forest floor that germinates, not a finished product.

## Run it
```bash
cd milyfe-mvp
./scripts/bootstrap.sh        # one-time: generates Synapse homeserver.yaml (idempotent)
docker compose up            # (optional) plants the full 13-seed service mesh
node src/slices/slice.mjs    # runs the CONNECT+WEALTH vertical slice — no install needed
node src/slices/test.mjs     # runs the Seed 1 + Seed 4 + engine test suite
```
> **First-time setup:** run `./scripts/bootstrap.sh` before the first `docker compose up`.
> It generates the Synapse config the `matrix` container can no longer auto-generate,
> and is a no-op on later runs once `./data/matrix/homeserver.yaml` exists. Pass `--up`
> to bootstrap and bring the mesh up in one go: `./scripts/bootstrap.sh --up`.
> **Runnable core is `.mjs` (plain Node, zero deps).** The `.ts` files are the typed
> specifications mirroring these; the `.mjs` files are what actually execute today.

## Layout
```
milyfe-mvp/
├─ docker-compose.yml            # Genesis Kit — 13 seeds as services (mocks where needed)
├─ src/
│  ├─ core/
│  │  ├─ foldstate.ts            # [OPT 2] single 7-fold state machine, 3 viewports
│  │  └─ twin-replication.ts     # [OPT 1] de-hyped "Quantum" → hot/warm/cold + spore
│  ├─ engine/
│  │  └─ formula-review.ts       # [OPT 3] verify-before-act Word-to-Math
│  ├─ safety/
│  │  └─ safety-fold.ts          # [OPT 6] cross-cutting guard (UI/formula/autonomy)
│  ├─ observability/
│  │  ├─ slo.ts                  # [OPT 5] latency budgets + SLOs
│  │  └─ otel-collector.yaml     # [OPT 6] OTel pipeline, tagged by Fold+Law
│  └─ slices/
│     └─ connect-wealth.ts       # [OPT 4] the vertical slice that breathes
└─ docs/
   ├─ threat-model.md            # [OPT 7] living threat model
   └─ latency-budgets.md         # [OPT 5] SLO rationale
```

## What "breathing" means here
On `npm run slice` a synthetic citizen drops ID+Vault (Dyad, Fib 2) → adds $MLY (Fib 3, eyes open) → a CONNECT message triggers Perception → an SLM Ribosome drafts a WEALTH formula ("save $200, no deprivation") → **it is reviewed, not executed blindly** → on approval it moves $MLY and the Selfie updates. No cloud. No surveillance.
