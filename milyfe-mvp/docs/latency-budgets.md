# MiLyfe OS — Latency Budgets & SLO Rationale (`latency-budgets.md`)

> **[OPT 5] Latency Budgets & SLOs**.
> Defines exact timing constraints to ensure a responsive, local-first user experience.

## 1. Concrete SLO Budgets

| Operation | Maximum Budget | Rationale |
|---|---|---|
| **Zero-Jump UI Response** | **200 ms** | Local-first UI transitions (e.g., Fold navigation, form updates) must execute without perceptible delay. |
| **Local SLM Ribosome Draft** | **500 ms** | Natural language Word-to-Math AST drafting on local hardware (Ollama / WebGPU / WASM) must return in under 500 ms. |
| **Twin CRDT Sync** | **1500 ms** | P2P background replication across Hot / Warm / Cold twins over local network or federation. |

## 2. Enforcement
`SLOTracker` (`src/observability/slo.mjs`) records every operation timestamp and emits an automated alert if any duration exceeds its budget.
