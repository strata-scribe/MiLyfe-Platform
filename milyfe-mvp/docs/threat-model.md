# MiLyfe OS — Living Threat Model (`threat-model.md`)

> **[OPT 7] Living Threat Model**, revisited each roadmap phase.
> Focuses on cryptographic boundaries, local-first data sovereignty, and Zero-Knowledge exteroception.

## 1. Primary Threat Surfaces

### 1.1 Unconsented Exteroception (Surveillance Leakage)
- **Threat**: Private interoception (Citizen ID, local ledger, personal journal) leaks to external networks or third parties.
- **Mitigation**: `SafetyFold` blocks any `EXTEROCEPTION_EXPORT` unless explicit cryptographic consent (`consentGranted = true`) is provided.

### 1.2 Unreviewed Word-to-Math Execution
- **Threat**: An SLM Ribosome or natural language prompt generates a formula that spends $MLY or Standing tokens without user awareness.
- **Mitigation**: All formulas must be converted to a structured AST (`FormulaReviewEngine`) and require an explicit user signature (`signature !== null`) before execution.

### 1.3 Twin Desynchronization & Spore Tampering
- **Threat**: An adversary injects a malicious state snapshot or tampered recovery spore.
- **Mitigation**: Spores are sha256-hashed and signed; `TwinReplication` validates hash integrity before recovering Hot/Warm/Cold twins.

### 1.4 Overdraft & Deprivation Attacks
- **Threat**: Automated scripts attempt to drain a citizen's $MLY balance below zero.
- **Mitigation**: `SafetyFold` enforces `NO_DEPRIVATION`, refusing any ledger debit that would cause a negative balance.
