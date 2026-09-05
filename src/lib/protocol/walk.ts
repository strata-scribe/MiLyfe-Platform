import Dexie, { Table } from 'dexie';
import { MiAction } from './action';

export interface QueuedAction {
  id: string;
  action: MiAction;
  queuedAt: number;
}

export class WalkDatabase extends Dexie {
  actions!: Table<QueuedAction, string>;

  constructor() {
    super('WalkDatabase');
    this.version(1).stores({
      actions: 'id, queuedAt'
    });
  }
}

export enum VectorClockComparison {
  EQUAL = 0,
  LOCAL_WINS = 1,
  SERVER_WINS = -1,
  CONCURRENT = 2,
}

export class WalkEngine {
  private db: WalkDatabase;

  constructor(db?: WalkDatabase) {
    this.db = db || new WalkDatabase();
  }

  async enqueue(action: MiAction): Promise<void> {
    await this.db.actions.put({
      id: action.id,
      action,
      queuedAt: Date.now()
    });
  }

  async getQueue(): Promise<MiAction[]> {
    const queued = await this.db.actions.orderBy('queuedAt').toArray();
    return queued.map(q => q.action);
  }

  async clearQueue(): Promise<void> {
    await this.db.actions.clear();
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.db.actions.delete(id);
  }

  compareVectorClocks(local: Record<string, number> = {}, server: Record<string, number> = {}): VectorClockComparison {
    let localGreater = false;
    let serverGreater = false;

    const allKeys = Array.from(new Set([...Object.keys(local), ...Object.keys(server)]));

    for (const key of allKeys) {
      const l = local[key] || 0;
      const s = server[key] || 0;

      if (l > s) localGreater = true;
      if (s > l) serverGreater = true;
    }

    if (localGreater && serverGreater) return VectorClockComparison.CONCURRENT;
    if (localGreater) return VectorClockComparison.LOCAL_WINS;
    if (serverGreater) return VectorClockComparison.SERVER_WINS;
    return VectorClockComparison.EQUAL;
  }

  mergeVectorClocks(local: Record<string, number> = {}, server: Record<string, number> = {}): Record<string, number> {
    const merged: Record<string, number> = { ...local };
    for (const [key, val] of Object.entries(server)) {
      merged[key] = Math.max(merged[key] || 0, val);
    }
    return merged;
  }

  resolveConflict(localAction: MiAction, serverAction: MiAction): MiAction | null {
    const rule = localAction.offlineSync?.conflict_rule || 'last_write_wins';

    switch (rule) {
      case 'last_write_wins':
        return localAction; // Assuming local is the latest since it's just coming online, or we can use vector clocks if present.
        // Actually, if we use vector clocks with LWW:
      case 'first_write_wins':
        return serverAction;
      case 'merge':
        // Basic merge: keep local changes but update vector clock
        const mergedAction = { ...localAction };
        mergedAction.offlineSync = {
          ...localAction.offlineSync,
          created_offline: localAction.offlineSync?.created_offline || false,
          conflict_rule: 'merge', // ensure it's not undefined
          vector_clock: this.mergeVectorClocks(
            localAction.offlineSync?.vector_clock,
            serverAction.offlineSync?.vector_clock
          )
        };
        // Merge payloads basic
        mergedAction.intent = {
          ...localAction.intent,
          payload: {
            ...serverAction.intent.payload,
            ...localAction.intent.payload
          }
        };
        return mergedAction;
      case 'human_review':
      case 'reject_later':
      case 'reservation':
        // For now, return local but marked for review, or keep server.
        // Returning local for these complex states allows the server to process the review state.
        return localAction;
      default:
        return localAction;
    }
  }

  async sync(serverActions: MiAction[], serverTimestamp: string): Promise<MiAction[]> {
    const queue = await this.getQueue();
    const resolvedActions: MiAction[] = [];
    const serverMap = new Map(serverActions.map(a => [a.id, a]));

    for (const localAction of queue) {
      const serverAction = serverMap.get(localAction.id);

      if (!serverAction) {
        // No conflict, safe to send to server
        // Update receipt timestamp to server time?
        if (localAction.receipt) {
            localAction.receipt.timestamp = serverTimestamp;
        }
        resolvedActions.push(localAction);
      } else {
        const vcComparison = this.compareVectorClocks(
          localAction.offlineSync?.vector_clock,
          serverAction.offlineSync?.vector_clock
        );

        if (vcComparison === VectorClockComparison.SERVER_WINS) {
          // Server is strictly newer, discard local
          resolvedActions.push(serverAction);
        } else if (vcComparison === VectorClockComparison.LOCAL_WINS) {
          // Local is strictly newer, keep local
          if (localAction.receipt) {
              localAction.receipt.timestamp = serverTimestamp;
          }
          resolvedActions.push(localAction);
        } else {
          // Concurrent or Equal
          const resolved = this.resolveConflict(localAction, serverAction);
          if (resolved) {
            if (resolved.receipt && resolved.id === localAction.id) {
                resolved.receipt.timestamp = serverTimestamp;
            }
            resolvedActions.push(resolved);
          }
        }
      }

      // Remove processed from queue
      await this.removeFromQueue(localAction.id);
    }

    return resolvedActions;
  }
}
