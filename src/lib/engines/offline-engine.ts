/**
 * Offline Engine — Web-compatible offline support
 * Replaces BLE/React Native offline with Service Worker + IndexedDB patterns
 *
 * Handles: connection state detection, action queuing, sync on reconnect,
 * offline lesson access, CRDT-ready conflict detection.
 */

import { storage } from "./storage";

export type ConnectionState = "online" | "neighbor-net" | "sending-later" | "offline";

export interface QueuedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  priority: "life-safety" | "money" | "message" | "normal";
  expiresAt: string | null;
  status: "queued" | "sending" | "sent" | "failed" | "conflict";
}

const QUEUE_KEY = "milyfe_offline_queue";

export const offlineEngine = {
  /**
   * Detect current connection state
   */
  getConnectionState(): ConnectionState {
    if (typeof navigator === "undefined") return "online";
    if (!navigator.onLine) return "offline";
    // Future: detect mesh/neighbor-net via WebRTC/BLE
    return "online";
  },

  /**
   * Queue an action for later execution
   */
  async queueAction(action: Omit<QueuedAction, "id" | "status">): Promise<QueuedAction> {
    const queued: QueuedAction = {
      ...action,
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "queued",
    };
    const queue = await this.getQueue();
    queue.push(queued);
    // Sort by priority: life-safety first
    queue.sort((a, b) => {
      const order = { "life-safety": 0, money: 1, message: 2, normal: 3 };
      return order[a.priority] - order[b.priority];
    });
    await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queued;
  },

  /**
   * Get all queued actions
   */
  async getQueue(): Promise<QueuedAction[]> {
    const raw = await storage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  /**
   * Process queue when connection returns
   */
  async processQueue(
    processor: (action: QueuedAction) => Promise<"sent" | "failed" | "conflict">
  ): Promise<void> {
    const queue = await this.getQueue();
    const results: QueuedAction[] = [];

    for (const action of queue) {
      if (action.status === "queued") {
        action.status = "sending";
        const result = await processor(action);
        action.status = result;
      }
      // Keep failed/conflict for user review
      if (action.status !== "sent") {
        results.push(action);
      }
    }

    await storage.setItem(QUEUE_KEY, JSON.stringify(results));
  },

  /**
   * Clear sent items from queue
   */
  async clearSent(): Promise<void> {
    const queue = await this.getQueue();
    const remaining = queue.filter((a) => a.status !== "sent");
    await storage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  },

  /**
   * Register online/offline listeners
   */
  onConnectionChange(callback: (state: ConnectionState) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handleOnline = () => callback("online");
    const handleOffline = () => callback("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  },
};
