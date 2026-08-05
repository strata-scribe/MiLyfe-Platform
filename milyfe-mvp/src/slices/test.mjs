// src/slices/test.mjs
// Automated test runner for the MiLyfe OS Vertical-Slice MVP (Genesis Kit).

import assert from 'assert';
import { FoldState } from '../core/foldstate.mjs';
import { TwinReplication } from '../core/twin-replication.mjs';
import { FormulaReviewEngine } from '../engine/formula-review.mjs';
import { SafetyFold } from '../safety/safety-fold.mjs';
import { SLOTracker } from '../observability/slo.mjs';
import { ConnectWealthSlice } from './connect-wealth.mjs';

function runAllTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      failed++;
    }
  }

  console.log('Running MiLyfe OS Genesis Kit Automated Tests...\n');

  console.log('1. [OPT 2] FoldState Machine');
  test('should initialize with phone viewport and 0_SELF active fold', () => {
    const fs = new FoldState('citizen_1');
    assert.strictEqual(fs.viewport, 'phone');
    assert.strictEqual(fs.activeFold, '0_SELF');
  });

  test('should transition folds and record history', () => {
    const fs = new FoldState('citizen_1');
    fs.foldTo('4_WEALTH');
    assert.strictEqual(fs.activeFold, '4_WEALTH');
    assert.strictEqual(fs.history.length, 1);
  });

  console.log('\n2. [OPT 1] Twin Replication & Spores');
  test('should register hot, warm, and cold twins and sync state via CRDT merge', () => {
    const rep = new TwinReplication('citizen_2');
    rep.registerTwin('hot_1', 'hot', { a: 10, b: { x: 1 } });
    rep.syncTwin('hot_1', { b: { y: 2 }, c: 30 });
    const twin = rep.twins.get('hot_1');
    assert.strictEqual(twin.data.a, 10);
    assert.strictEqual(twin.data.b.x, 1);
    assert.strictEqual(twin.data.b.y, 2);
    assert.strictEqual(twin.data.c, 30);
  });

  test('should create a spore seed and recover a twin from it', () => {
    const rep = new TwinReplication('citizen_2');
    rep.registerTwin('hot_1', 'hot', { balanceMLY: 250 });
    const spore = rep.createSpore('hot_1');
    assert.ok(spore.sporeHash);
    const recovered = rep.recoverFromSpore(spore.sporeId);
    assert.strictEqual(recovered.data.balanceMLY, 250);
  });

  console.log('\n3. [OPT 3] Formula Review Engine (Word-to-Math)');
  test('should parse natural language into an AST formula', () => {
    const engine = new FormulaReviewEngine();
    const ast = engine.parseWordToMath('Allocate 150 MLY for Circle community garden');
    assert.strictEqual(ast.action, 'ALLOCATE');
    assert.strictEqual(ast.amount, 150);
    assert.strictEqual(ast.asset, 'MLY');
    assert.strictEqual(ast.charterCompliant, true);
  });

  test('should flag Charter violations for deprivation or invalid amounts', () => {
    const engine = new FormulaReviewEngine();
    const ast = engine.parseWordToMath('Allocate -50 MLY for deprivation test');
    assert.strictEqual(ast.charterCompliant, false);
    assert.ok(ast.violations.length > 0);
  });

  test('should require review before cryptographic signing', () => {
    const engine = new FormulaReviewEngine();
    const ast = engine.parseWordToMath('Save 200 MLY for emergency fund');
    assert.throws(() => engine.signFormula(ast, 'citizen_1'), /Cannot sign an unreviewed/);
    const reviewed = engine.reviewFormula(ast.id, 'APPROVE', 'Verified');
    const signed = engine.signFormula(reviewed, 'citizen_1');
    assert.ok(signed.signature);
  });

  console.log('\n4. [OPT 6] SafetyFold Cross-Cutting Guard');
  test('should block unsigned formulas and unauthorized overdrafts', () => {
    const safety = new SafetyFold('citizen_3');
    const check1 = safety.guardAction('EXECUTE_FORMULA', { formula: { reviewed: false } });
    assert.strictEqual(check1.passed, false);

    const check2 = safety.guardAction('LEDGER_DEBIT', { currentBalance: 50, amount: 100, overdraftAllowed: false });
    assert.strictEqual(check2.passed, false);
    assert.strictEqual(safety.blockedCount, 2);
  });

  console.log('\n5. [OPT 5] SLO Latency Budgets');
  test('should record duration and flag violations above 200ms budget', () => {
    const slo = new SLOTracker();
    slo.record('UI_RENDER', 18);
    slo.record('UI_RENDER_SLOW', 350);
    const metrics = slo.getMetrics();
    assert.strictEqual(metrics.total, 2);
    assert.strictEqual(metrics.violations, 1);
  });

  console.log('\n6. [OPT 4] ConnectWealthSlice End-to-End Vertical Slice');
  test('should execute full 5-step CONNECT+WEALTH slice breathing workflow', () => {
    const slice = new ConnectWealthSlice('citizen_test_99');
    slice.initiateCitizenVault(500, 50);
    slice.receiveConnectMessage('steward_1', 'Let us allocate 100 MLY for housing support.');
    const ast = slice.draftWealthFormula('Allocate 100 MLY for housing support');
    const signed = slice.reviewAndSignFormula(ast, 'APPROVE', 'Looks good');
    const snap = slice.executeWealthFormula(signed);
    assert.strictEqual(snap.state['4_WEALTH'].balanceMLY, 400);
    assert.strictEqual(snap.state['4_WEALTH'].ledger.length, 1);
    const report = slice.getCompleteReport();
    assert.strictEqual(report.sloMetrics.complianceRate, 1.0);
  });

  console.log(`\n====================================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('test.mjs')) {
  runAllTests();
}

export { runAllTests };
