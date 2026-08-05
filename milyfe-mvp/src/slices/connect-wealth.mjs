// src/slices/connect-wealth.mjs
// [OPT 4] Vertical-Slice MVP combining CONNECT (1:1/Circle chat) + WEALTH ($MLY Word-to-Math).

import { FoldState } from '../core/foldstate.mjs';
import { TwinReplication } from '../core/twin-replication.mjs';
import { FormulaReviewEngine } from '../engine/formula-review.mjs';
import { SafetyFold } from '../safety/safety-fold.mjs';
import { SLOTracker } from '../observability/slo.mjs';

export class ConnectWealthSlice {
  constructor(citizenId = 'citizen_founding_1') {
    this.citizenId = citizenId;
    this.foldState = new FoldState(citizenId, 'phone');
    this.twinRep = new TwinReplication(citizenId);
    this.formulaEngine = new FormulaReviewEngine();
    this.safety = new SafetyFold(citizenId);
    this.slo = new SLOTracker();

    // Initialize Hot and Warm Twins
    this.hotTwin = this.twinRep.registerTwin('phone_hot_01', 'hot', {
      mlyBalance: 300,
      standing: 50,
      circleId: 'circle_7_genesis'
    });
    this.warmTwin = this.twinRep.registerTwin('homeserver_warm_01', 'warm', {
      mlyBalance: 300,
      standing: 50,
      circleId: 'circle_7_genesis'
    });
  }

  // Step 1: Citizen drops ID + Vault (Dyad, Fib 2) and adds $MLY (Fib 3)
  initiateCitizenVault(initialMLY = 300, initialStanding = 50) {
    const start = Date.now();
    this.foldState.updateFold('1_IDENTITY', { vaultUnlocked: true });
    this.foldState.updateFold('4_WEALTH', { balanceMLY: initialMLY, standing: initialStanding });
    this.slo.record('INIT_VAULT', Date.now() - start);
    return this.foldState.getSnapshot();
  }

  // Step 2: CONNECT message triggers Perception & SLM Ribosome drafting
  receiveConnectMessage(senderId, messageText) {
    const start = Date.now();
    const currentMsg = this.foldState.state['2_CONNECT'].messages || [];
    currentMsg.push({
      sender: senderId,
      text: messageText,
      receivedAt: Date.now()
    });
    this.foldState.updateFold('2_CONNECT', { messages: currentMsg });
    this.slo.record('CONNECT_MSG_RCV', Date.now() - start);
    return currentMsg;
  }

  // Step 3: SLM Ribosome drafts a WEALTH formula from natural language
  draftWealthFormula(naturalLanguageInput) {
    const start = Date.now();
    const ast = this.formulaEngine.parseWordToMath(naturalLanguageInput);
    this.slo.record('SLM_RIBOSOME_DRAFT', Date.now() - start);
    return ast;
  }

  // Step 4: Verify-before-act review & cryptographic signature
  reviewAndSignFormula(astId, decision = 'APPROVE', notes = 'Citizen verified AST') {
    const start = Date.now();
    const reviewed = this.formulaEngine.reviewFormula(astId, decision, notes);
    const signed = this.formulaEngine.signFormula(reviewed, this.citizenId, 'local_vault_secret_key');
    this.slo.record('FORMULA_REVIEW_SIGN', Date.now() - start);
    return signed;
  }

  // Step 5: Execute reviewed formula on $MLY Ledger with SafetyFold guard
  executeWealthFormula(signedAst) {
    const start = Date.now();
    // Safety check before execution
    this.safety.assertSafe('EXECUTE_FORMULA', { formula: signedAst });

    const currentMLY = this.foldState.state['4_WEALTH'].balanceMLY;
    if (signedAst.action === 'ALLOCATE' || signedAst.action === 'TRANSFER') {
      this.safety.assertSafe('LEDGER_DEBIT', {
        currentBalance: currentMLY,
        amount: signedAst.amount,
        overdraftAllowed: false
      });
      const newBalance = currentMLY - signedAst.amount;
      const ledger = this.foldState.state['4_WEALTH'].ledger || [];
      const tx = {
        txId: `tx_${Date.now()}`,
        action: signedAst.action,
        amount: signedAst.amount,
        asset: signedAst.asset,
        target: signedAst.target,
        timestamp: Date.now()
      };
      ledger.push(tx);
      this.foldState.updateFold('4_WEALTH', { balanceMLY: newBalance, ledger });

      // Sync Hot -> Warm twin
      this.twinRep.syncTwin('homeserver_warm_01', { mlyBalance: newBalance });
    }

    // Update Central Selfie health hash
    const healthHash = `selfie_${Date.now().toString(36)}`;
    this.foldState.updateFold('0_SELF', {
      health: 100,
      consensusImageHash: healthHash,
      lastRendered: Date.now()
    });

    this.slo.record('EXECUTE_LEDGER_TX', Date.now() - start);
    return this.foldState.getSnapshot();
  }

  getCompleteReport() {
    return {
      citizenId: this.citizenId,
      foldSnapshot: this.foldState.getSnapshot(),
      twinStatus: this.twinRep.getHealthStatus(),
      safetyReport: this.safety.getSecurityReport(),
      sloMetrics: this.slo.getMetrics()
    };
  }
}
