// src/observability/slo.mjs
// [OPT 5] Latency Budgets & SLO Tracker (<200ms Zero-Jump UI, <500ms Local SLM).

export const BUDGETS = {
  ZERO_JUMP_UI_MS: 200,
  LOCAL_SLM_MS: 500,
  TWIN_SYNC_MS: 1500
};

export class SLOTracker {
  constructor() {
    this.measurements = [];
    this.alerts = [];
  }

  record(operation, durationMs, tags = {}) {
    const entry = {
      operation,
      durationMs,
      tags,
      timestamp: Date.now(),
      violation: false
    };

    let budget = BUDGETS.ZERO_JUMP_UI_MS;
    if (operation.includes('SLM') || operation.includes('RIBOSOME')) {
      budget = BUDGETS.LOCAL_SLM_MS;
    } else if (operation.includes('SYNC') || operation.includes('TWIN')) {
      budget = BUDGETS.TWIN_SYNC_MS;
    }

    if (durationMs > budget) {
      entry.violation = true;
      const alert = {
        operation,
        durationMs,
        budget,
        message: `SLO Budget Exceeded for ${operation}: ${durationMs}ms > ${budget}ms`,
        timestamp: Date.now()
      };
      this.alerts.push(alert);
    }

    this.measurements.push(entry);
    return entry;
  }

  getMetrics() {
    const total = this.measurements.length;
    if (total === 0) {
      return { total: 0, complianceRate: 1.0, avgDurationMs: 0, alerts: [] };
    }
    const violations = this.measurements.filter(m => m.violation).length;
    const sum = this.measurements.reduce((acc, m) => acc + m.durationMs, 0);
    return {
      total,
      violations,
      complianceRate: Number(((total - violations) / total).toFixed(4)),
      avgDurationMs: Number((sum / total).toFixed(2)),
      alerts: this.alerts
    };
  }
}
