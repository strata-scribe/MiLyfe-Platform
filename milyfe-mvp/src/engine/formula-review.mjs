// src/engine/formula-review.mjs
// [OPT 3] Verify-Before-Act Word-to-Math Formal Grammar Parser & AST Reviewer.

import crypto from 'crypto';

export class FormulaReviewEngine {
  constructor(charterRules = ['no_deprivation', 'no_surveillance', 'consent_required']) {
    this.charterRules = charterRules;
    this.history = [];
  }

  parseWordToMath(rawInput) {
    const input = String(rawInput || '').trim();
    if (!input) {
      throw new Error('Empty formula input');
    }

    // Pattern matching grammar for Word-to-Math AST
    // Examples:
    //   "Allocate 150 MLY for Circle community garden"
    //   "Save $200, no deprivation"
    //   "Transfer 25 Standing to citizen_789"
    const ast = {
      id: `ast_${crypto.randomBytes(6).toString('hex')}`,
      raw: input,
      action: 'UNKNOWN',
      amount: 0,
      asset: 'MLY',
      target: 'SELF',
      charterCompliant: true,
      violations: [],
      reviewed: false,
      signature: null,
      createdAt: Date.now()
    };

    const lower = input.toLowerCase();

    // Parse action
    if (lower.includes('allocate') || lower.includes('spend') || lower.includes('fund')) {
      ast.action = 'ALLOCATE';
    } else if (lower.includes('save') || lower.includes('set aside') || lower.includes('reserve')) {
      ast.action = 'SAVE';
    } else if (lower.includes('transfer') || lower.includes('send') || lower.includes('pay')) {
      ast.action = 'TRANSFER';
    } else {
      ast.action = 'PROPOSE';
    }

    // Parse amount
    const amountMatch = input.match(/(?:\$|MLY\s*|Standing\s*)?(\d+(?:\.\d+)?)/i);
    if (amountMatch) {
      ast.amount = Number(amountMatch[1]);
    }

    // Parse asset
    if (/standing/i.test(input)) {
      ast.asset = 'STANDING';
    } else {
      ast.asset = 'MLY';
    }

    // Parse target / recipient
    const toMatch = input.match(/(?:to|for)\s+([A-Za-z0-9_\-\s]+)(?:,|$)/i);
    if (toMatch) {
      ast.target = toMatch[1].trim();
    }

    // Verify Charter compliance
    if (lower.includes('deprive') || (lower.includes('deprivation') && !lower.includes('no deprivation'))) {
      ast.charterCompliant = false;
      ast.violations.push('violates_no_deprivation');
    }
    if (isNaN(ast.amount) || !isFinite(ast.amount) || ast.amount <= 0) {
      ast.charterCompliant = false;
      ast.violations.push('invalid_amount');
    }
    if (ast.amount > 1000000) {
      ast.charterCompliant = false;
      ast.violations.push('exceeds_max_single_tx_cap');
    }

    this.history.push(ast);
    return ast;
  }

  reviewFormula(astId, userReviewDecision, notes = '') {
    const ast = typeof astId === 'object' ? astId : this.history.find(a => a.id === astId);
    if (!ast) {
      throw new Error(`Formula AST not found: ${astId}`);
    }
    if (!ast.charterCompliant && userReviewDecision === 'APPROVE') {
      throw new Error(`Cannot approve formula with Charter violations: ${ast.violations.join(', ')}`);
    }

    ast.reviewed = true;
    ast.reviewDecision = userReviewDecision; // 'APPROVE' | 'REJECT'
    ast.reviewNotes = notes;
    ast.reviewedAt = Date.now();

    return ast;
  }

  signFormula(ast, citizenId, privateKeySecret) {
    if (!ast.reviewed || ast.reviewDecision !== 'APPROVE') {
      throw new Error('Cannot sign an unreviewed or rejected formula');
    }
    const payload = `${ast.id}:${ast.action}:${ast.amount}:${ast.asset}:${ast.target}:${citizenId}`;
    const signature = crypto.createHmac('sha256', privateKeySecret || 'milyfe_default_key').update(payload).digest('hex');
    ast.signature = signature;
    ast.signedBy = citizenId;
    ast.signedAt = Date.now();
    this.history.push(ast);
    return ast;
  }
}
