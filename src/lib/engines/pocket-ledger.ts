/**
 * Pocket Ledger (Web) — $MLY credit management for Next.js
 * Clean implementation that will connect to Supabase in Phase 4.
 * $MLY Credits are REAL from day one. Voluntary peer-swap is legal.
 */

export interface Transaction {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  memo: string;
  status: "draft" | "walking" | "arrived" | "failed" | "frozen";
  createdAt: string;
}

export interface Jar {
  id: string;
  ownerId: string;
  name: string;
  purpose: string;
  targetAmount: number;
  balance: number;
  members: string[];
  approvalThreshold: number;
}

export const pocketLedger = {
  async sendThanks(params: {
    fromId: string;
    toId: string;
    amount: number;
    memo: string;
  }): Promise<Transaction> {
    return {
      id: `tx_${Date.now()}`,
      ...params,
      status: "walking",
      createdAt: new Date().toISOString(),
    };
  },

  async getBalance(userId: string): Promise<number> {
    // Will query Supabase in Phase 4
    return 500; // Starting balance for new members
  },

  async getTransactions(userId: string): Promise<Transaction[]> {
    return [];
  },

  async freezePocket(userId: string): Promise<void> {
    // Marks all pending as frozen — safety feature
  },

  async unfreezePocket(userId: string): Promise<void> {},
};
