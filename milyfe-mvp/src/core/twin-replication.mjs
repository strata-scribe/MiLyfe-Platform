// src/core/twin-replication.mjs
// [OPT 1] De-hype internals: "Quantum" -> Hot / Warm / Cold Twin Replication + Spore Recovery.

import crypto from 'crypto';

export class TwinReplication {
  constructor(citizenId) {
    this.citizenId = citizenId;
    this.twins = new Map(); // id -> { tier: 'hot'|'warm'|'cold', lastSync: number, dataHash: string, data: object }
    this.spores = [];       // compressed recovery seeds
  }

  registerTwin(twinId, tier = 'warm', initialData = {}) {
    if (!['hot', 'warm', 'cold'].includes(tier)) {
      throw new Error(`Invalid twin tier: ${tier}`);
    }
    const dataHash = this._hash(initialData);
    const twin = {
      id: twinId,
      tier,
      lastSync: Date.now(),
      dataHash,
      data: JSON.parse(JSON.stringify(initialData))
    };
    this.twins.set(twinId, twin);
    return twin;
  }

  syncTwin(twinId, latestData) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin ${twinId} not registered`);
    }
    twin.data = this._crdtMerge(twin.data, latestData);
    twin.dataHash = this._hash(twin.data);
    twin.lastSync = Date.now();
    return twin;
  }

  createSpore(fromTwinId) {
    const twin = this.twins.get(fromTwinId);
    if (!twin) {
      throw new Error(`Cannot create spore from unregistered twin: ${fromTwinId}`);
    }
    const payload = JSON.stringify({
      citizenId: this.citizenId,
      sourceTwinId: fromTwinId,
      data: twin.data,
      created: Date.now()
    });
    const sporeId = `spore_${crypto.randomBytes(8).toString('hex')}`;
    const sporeHash = crypto.createHash('sha256').update(payload).digest('hex');
    const spore = {
      sporeId,
      sporeHash,
      payload,
      created: Date.now()
    };
    this.spores.push(spore);
    return spore;
  }

  recoverFromSpore(sporeId) {
    const spore = this.spores.find(s => s.sporeId === sporeId);
    if (!spore) {
      throw new Error(`Spore not found: ${sporeId}`);
    }
    const verifiedHash = crypto.createHash('sha256').update(spore.payload).digest('hex');
    if (verifiedHash !== spore.sporeHash) {
      throw new Error(`Spore integrity check failed for ${sporeId}`);
    }
    const decoded = JSON.parse(spore.payload);
    const hotId = `${this.citizenId}_hot_recovered`;
    return this.registerTwin(hotId, 'hot', decoded.data);
  }

  getHealthStatus() {
    const tiers = { hot: 0, warm: 0, cold: 0 };
    for (const [, t] of this.twins) {
      tiers[t.tier]++;
    }
    return {
      citizenId: this.citizenId,
      totalTwins: this.twins.size,
      tiers,
      totalSpores: this.spores.length,
      resilient: tiers.hot > 0 && (tiers.warm > 0 || tiers.cold > 0 || this.spores.length > 0)
    };
  }

  _crdtMerge(base, incoming) {
    const merged = { ...base };
    for (const key of Object.keys(incoming)) {
      if (typeof incoming[key] === 'object' && incoming[key] !== null && !Array.isArray(incoming[key])) {
        merged[key] = { ...(merged[key] || {}), ...incoming[key] };
      } else {
        merged[key] = incoming[key];
      }
    }
    return merged;
  }

  _hash(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
  }
}
