import Dexie, { type Table } from 'dexie';

export interface QueuedAction {
  id?: number;
  type: 'checkin' | 'report' | 'post' | 'send_mly' | 'rsvp' | 'upvote' | 'message' | 'listing' | 'review';
  payload: Record<string, unknown>;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  createdAt: number;
  retries: number;
  lastError?: string;
  userId: string;
}

export interface CachedData {
  id?: number;
  key: string;
  data: unknown;
  cachedAt: number;
  expiresAt: number;
}

class MiLyfeOfflineDB extends Dexie {
  actions!: Table<QueuedAction>;
  cache!: Table<CachedData>;

  constructor() {
    super('milyfe-offline');
    this.version(1).stores({
      actions: '++id, type, userId, createdAt',
      cache: '++id, &key, expiresAt',
    });
  }
}

export const offlineDB = new MiLyfeOfflineDB();
