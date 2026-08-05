// src/core/foldstate.mjs
// [OPT 2] Single 7-Fold State Machine for Phone, AR, and Homeserver viewports.

export const VIEWPORTS = ['phone', 'ar', 'homeserver'];
export const FOLDS = [
  '0_SELF',       // Central Image / Health
  '1_IDENTITY',   // Twin Replication & Vault
  '2_CONNECT',    // Circles 7-13 & Matrix
  '3_PERCEPTION', // SLM & Sensory Loop
  '4_WEALTH',     // Word-to-Math & $MLY Ledger
  '5_SAFETY',     // Charter & Governance Guard
  '6_AUTO_OPS'    // Immune / Observability
];

export class FoldState {
  constructor(citizenId, initialViewport = 'phone') {
    if (!VIEWPORTS.includes(initialViewport)) {
      throw new Error(`Invalid viewport: ${initialViewport}`);
    }
    this.citizenId = citizenId;
    this.viewport = initialViewport;
    this.activeFold = '0_SELF';
    this.state = {
      '0_SELF': { health: 100, consensusImageHash: null, lastRendered: Date.now() },
      '1_IDENTITY': { vaultUnlocked: false, twinsCount: 1, sporesCount: 0 },
      '2_CONNECT': { circleId: null, membersCount: 1, messages: [] },
      '3_PERCEPTION': { slmReady: true, interoceptionActive: true },
      '4_WEALTH': { balanceMLY: 100, standing: 10, ledger: [] },
      '5_SAFETY': { charterAccepted: true, activeGuards: ['charter_v1', 'verify_math'] },
      '6_AUTO_OPS': { latencyAvgMs: 15, alerts: [] }
    };
    this.history = [];
  }

  setViewport(vp) {
    if (!VIEWPORTS.includes(vp)) {
      throw new Error(`Invalid viewport: ${vp}`);
    }
    const prev = this.viewport;
    this.viewport = vp;
    this._record('VIEWPORT_CHANGE', { from: prev, to: vp });
    return this;
  }

  foldTo(foldName) {
    if (!FOLDS.includes(foldName)) {
      throw new Error(`Unknown fold: ${foldName}`);
    }
    const prev = this.activeFold;
    this.activeFold = foldName;
    this._record('FOLD_TRANSITION', { from: prev, to: foldName, viewport: this.viewport });
    return this.state[foldName];
  }

  updateFold(foldName, patch) {
    if (!FOLDS.includes(foldName)) {
      throw new Error(`Unknown fold: ${foldName}`);
    }
    this.state[foldName] = { ...this.state[foldName], ...patch };
    this._record('FOLD_UPDATE', { fold: foldName, patch });
    return this.state[foldName];
  }

  getSnapshot() {
    return {
      citizenId: this.citizenId,
      viewport: this.viewport,
      activeFold: this.activeFold,
      state: JSON.parse(JSON.stringify(this.state)),
      timestamp: Date.now()
    };
  }

  _record(action, payload) {
    this.history.push({
      action,
      payload,
      timestamp: Date.now()
    });
  }
}
