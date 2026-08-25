import Dexie, { type Table } from 'dexie';

/**
 * MiLyfe Offline Database (IndexedDB via Dexie)
 *
 * Stores critical data locally for offline access:
 * - Profile cache
 * - Wallet balance snapshot
 * - Recent messages
 * - Learn progress
 * - Community resources
 * - Outbox (queued actions for sync)
 */

// ---------- Table Interfaces ----------

export interface CachedProfile {
  id: string; // user ID
  username: string;
  display_name: string;
  avatar_url: string | null;
  neighborhood: string | null;
  cached_at: number; // timestamp
}

export interface CachedWallet {
  id: string; // user ID
  spending_balance: number;
  savings_balance: number;
  community_balance: number;
  cached_at: number;
}

export interface CachedMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read: boolean;
  created_at: string;
  cached_at: number;
}

export interface CachedResource {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  confidence: number;
  cached_at: number;
}

export interface CachedLearnProgress {
  id: string; // module_id
  user_id: string;
  path_slug: string;
  module_title: string;
  status: string;
  progress_percent: number;
  cached_at: number;
}

export interface OutboxItem {
  id?: number; // auto-increment
  action_type: string;
  payload: Record<string, unknown>;
  created_at: number;
  retries: number;
  last_error: string | null;
  status: 'pending' | 'sending' | 'failed';
}

export interface SyncMeta {
  key: string;
  value: string;
  updated_at: number;
}

// ---------- Database Class ----------

export class MiLyfeOfflineDB extends Dexie {
  profiles!: Table<CachedProfile, string>;
  wallets!: Table<CachedWallet, string>;
  messages!: Table<CachedMessage, string>;
  resources!: Table<CachedResource, string>;
  learnProgress!: Table<CachedLearnProgress, string>;
  outbox!: Table<OutboxItem, number>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super('milyfe-offline');

    this.version(1).stores({
      profiles: 'id, username, cached_at',
      wallets: 'id, cached_at',
      messages: 'id, sender_id, receiver_id, created_at, cached_at',
      resources: 'id, category, cached_at',
      learnProgress: 'id, user_id, path_slug, cached_at',
      outbox: '++id, action_type, status, created_at',
      syncMeta: 'key, updated_at',
    });
  }
}

// Singleton instance
export const offlineDB = new MiLyfeOfflineDB();
