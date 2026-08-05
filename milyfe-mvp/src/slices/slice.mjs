// src/slices/slice.mjs
// Standalone runnable vertical-slice MVP demo script.
// Runs the CONNECT + WEALTH vertical slice with Zero-Jump latency and verify-before-act safety.

import { ConnectWealthSlice } from './connect-wealth.mjs';

function runSliceDemo() {
  console.log('====================================================================');
  console.log('                 MiLyfe OS — VERTICAL-SLICE MVP                      ');
  console.log('                 CONNECT + WEALTH (7 Lead Optimizations)            ');
  console.log('====================================================================\n');

  const slice = new ConnectWealthSlice('citizen_founding_7');

  console.log('[1/5] Initializing Citizen Vault (Dyad, Fib 2, eyes open)...');
  const snap1 = slice.initiateCitizenVault(500, 50);
  console.log(`      ✓ Vault Unlocked. Balance: ${snap1.state['4_WEALTH'].balanceMLY} $MLY | ${snap1.state['4_WEALTH'].standing} Standing\n`);

  console.log('[2/5] Receiving CONNECT message in Circle (7 citizens)...');
  slice.receiveConnectMessage('steward_circle_1', 'We need 150 MLY for our Circle mutual garden soil and seeds.');
  console.log('      ✓ CONNECT message received. Triggering Perception & SLM Ribosome...\n');

  console.log('[3/5] SLM Ribosome drafting WEALTH formula from natural language...');
  const ast = slice.draftWealthFormula('Allocate 150 MLY for Circle community garden');
  console.log('      ✓ Formula AST Drafted:');
  console.log(`        - Action:  ${ast.action}`);
  console.log(`        - Amount:  ${ast.amount} ${ast.asset}`);
  console.log(`        - Target:  ${ast.target}`);
  console.log(`        - Charter: ${ast.charterCompliant ? 'COMPLIANT' : 'VIOLATION'}\n`);

  console.log('[4/5] Verify-Before-Act Review: Citizen inspects AST & cryptographically signs...');
  const signedAst = slice.reviewAndSignFormula(ast, 'APPROVE', 'Verified math & community garden proposal');
  console.log(`      ✓ Formula Reviewed & Signed! Signature: ${signedAst.signature.slice(0, 16)}...\n`);

  console.log('[5/5] Executing Formula on Ledger with SafetyFold guard...');
  const finalSnap = slice.executeWealthFormula(signedAst);
  const newBalance = finalSnap.state['4_WEALTH'].balanceMLY;
  const ledgerCount = finalSnap.state['4_WEALTH'].ledger.length;
  console.log(`      ✓ Ledger Updated! New Balance: ${newBalance} $MLY | Ledger Entries: ${ledgerCount}`);
  console.log(`      ✓ Central Selfie Consensus Hash: ${finalSnap.state['0_SELF'].consensusImageHash}\n`);

  console.log('====================================================================');
  console.log('                      OBSERVABILITY & SLO REPORT                    ');
  console.log('====================================================================');
  const report = slice.getCompleteReport();
  console.log(`Total Operations Tracked : ${report.sloMetrics.total}`);
  console.log(`SLO Compliance Rate      : ${(report.sloMetrics.complianceRate * 100).toFixed(1)}%`);
  console.log(`Average Latency          : ${report.sloMetrics.avgDurationMs} ms (<200 ms Zero-Jump budget)`);
  console.log(`SafetyFold Checks        : ${report.safetyReport.totalChecked} checked (${report.safetyReport.blockedCount} blocked)`);
  console.log(`Twin Replication Status  : ${report.twinStatus.totalTwins} active twins (${report.twinStatus.resilient ? 'RESILIENT' : 'VULNERABLE'})`);
  console.log('====================================================================\n');
  console.log('✓ Vertical Slice execution complete. No cloud. Sovereign local execution.');
}

if (process.argv[1] && process.argv[1].endsWith('slice.mjs')) {
  runSliceDemo();
}

export { runSliceDemo };
