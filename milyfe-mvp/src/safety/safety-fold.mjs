// src/safety/safety-fold.mjs
// [OPT 6] Cross-Cutting Safety Fold Guard for UI, Formula, and Autonomy actions.

export const CHARTER_PRINCIPLES = [
  'OWNERSHIP_SOVEREIGNTY',
  'VOICE_CONSENT',
  'NO_DEPRIVATION',
  'TRANSPARENT_INSPECTION',
  'DIGNITY_RECYCLING'
];

export class SafetyFold {
  constructor(citizenId) {
    this.citizenId = citizenId;
    this.auditLog = [];
    this.blockedCount = 0;
  }

  guardAction(actionType, context) {
    const check = {
      id: `safe_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      actionType,
      context,
      passed: true,
      violations: [],
      timestamp: Date.now()
    };

    // Rule 1: No exteroception without explicit consent
    if (actionType === 'EXTEROCEPTION_EXPORT' && !context.consentGranted) {
      check.passed = false;
      check.violations.push('VOICE_CONSENT: Explicit consent required for external export');
    }

    // Rule 2: No unverified formulas may be executed
    if (actionType === 'EXECUTE_FORMULA') {
      if (!context.formula || !context.formula.reviewed || !context.formula.signature) {
        check.passed = false;
        check.violations.push('TRANSPARENT_INSPECTION: Unreviewed or unsigned formula execution blocked');
      }
    }

    // Rule 3: No deprivation or negative balance without alert
    if (actionType === 'LEDGER_DEBIT') {
      if ((context.currentBalance || 0) - (context.amount || 0) < 0 && !context.overdraftAllowed) {
        check.passed = false;
        check.violations.push('NO_DEPRIVATION: Cannot drive citizen balance below zero without explicit charter exception');
      }
    }

    if (!check.passed) {
      this.blockedCount++;
    }

    this.auditLog.push(check);
    return check;
  }

  assertSafe(actionType, context) {
    const result = this.guardAction(actionType, context);
    if (!result.passed) {
      const msg = `SafetyFold Blocked [${actionType}]: ${result.violations.join('; ')}`;
      const err = new Error(msg);
      err.violations = result.violations;
      throw err;
    }
    return true;
  }

  getSecurityReport() {
    return {
      citizenId: this.citizenId,
      totalChecked: this.auditLog.length,
      blockedCount: this.blockedCount,
      recentLogs: this.auditLog.slice(-10)
    };
  }
}
