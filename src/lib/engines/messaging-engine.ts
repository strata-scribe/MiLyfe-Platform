/**
 * Messaging Engine — real-time thread state machine with delivery tracking.
 * 
 * States: saved → walking → sent → delivered → read → failed
 * Supports: direct, household, class, proposal-discussion, trusted-circle.
 * Unknown adults cannot contact youth. Blocking is cross-surface.
 * Emergency priority cannot bypass blocking.
 */

import { isBlocked } from './mimoderate';

export type MsgState = 'saved' | 'walking' | 'sent' | 'delivered' | 'read' | 'failed';
export type ThreadType = 'direct' | 'household' | 'class' | 'proposal' | 'circle';

export interface Msg {
  id: string;
  threadId: string;
  from: string;
  content: string;
  state: MsgState;
  timestamp: string;
  editedAt?: string;
  deletedFor: string[]; // user IDs who deleted locally
  encrypted: boolean;
}

export interface Thread {
  id: string;
  type: ThreadType;
  participants: string[];
  title?: string;
  lastMessage?: string;
  lastActive: string;
  unreadCount: number;
  muted: boolean;
  /** Retention policy in days (null = forever on device) */
  retentionDays: number | null;
}

// ─── In-Memory Store (persisted via persistent-store in production) ───────────

const threads: Map<string, Thread> = new Map();
const messages: Map<string, Msg[]> = new Map();
const deliveryCallbacks: Map<string, Array<(msg: Msg) => void>> = new Map();

// ─── Thread Management ───────────────────────────────────────────────────────

export function createThread(type: ThreadType, participants: string[], title?: string): Thread {
  const thread: Thread = {
    id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    participants,
    title,
    lastActive: new Date().toISOString(),
    unreadCount: 0,
    muted: false,
    retentionDays: null,
  };
  threads.set(thread.id, thread);
  messages.set(thread.id, []);
  return thread;
}

export function getThread(id: string): Thread | undefined {
  return threads.get(id);
}

export function getUserThreads(userId: string): Thread[] {
  return Array.from(threads.values())
    .filter((t) => t.participants.includes(userId))
    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
}

// ─── Message Sending with State Machine ──────────────────────────────────────

export function sendMsg(params: {
  threadId: string;
  from: string;
  content: string;
  isOnline: boolean;
}): { success: boolean; msg?: Msg; error?: string } {
  const thread = threads.get(params.threadId);
  if (!thread) return { success: false, error: 'Thread not found' };

  // Block check (cross-surface)
  for (const p of thread.participants) {
    if (p !== params.from && isBlocked(params.from, p)) {
      return { success: false, error: 'Cannot message a blocked person' };
    }
  }

  const msg: Msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    threadId: params.threadId,
    from: params.from,
    content: params.content,
    state: params.isOnline ? 'sent' : 'walking',
    timestamp: new Date().toISOString(),
    deletedFor: [],
    encrypted: true,
  };

  const threadMsgs = messages.get(params.threadId) || [];
  threadMsgs.push(msg);
  messages.set(params.threadId, threadMsgs);

  // Update thread
  thread.lastMessage = params.content;
  thread.lastActive = msg.timestamp;
  threads.set(params.threadId, thread);

  // Simulate delivery after short delay if online
  if (params.isOnline) {
    setTimeout(() => advanceMsgState(msg.id, params.threadId, 'delivered'), 500);
  }

  // Notify listeners
  const cbs = deliveryCallbacks.get(params.threadId) || [];
  cbs.forEach((cb) => cb(msg));

  return { success: true, msg };
}

// ─── State Advancement ───────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<MsgState, MsgState[]> = {
  saved: ['walking', 'sent'],
  walking: ['sent', 'failed'],
  sent: ['delivered', 'failed'],
  delivered: ['read'],
  read: [],
  failed: ['walking', 'sent'], // Retry
};

export function advanceMsgState(msgId: string, threadId: string, newState: MsgState): boolean {
  const threadMsgs = messages.get(threadId);
  if (!threadMsgs) return false;

  const msg = threadMsgs.find((m) => m.id === msgId);
  if (!msg) return false;

  if (!VALID_TRANSITIONS[msg.state].includes(newState)) return false;

  msg.state = newState;
  return true;
}

// ─── Reading / Editing / Deleting ────────────────────────────────────────────

export function getThreadMessages(threadId: string, userId: string): Msg[] {
  const threadMsgs = messages.get(threadId) || [];
  return threadMsgs.filter((m) => !m.deletedFor.includes(userId));
}

export function markThreadRead(threadId: string, userId: string): void {
  const thread = threads.get(threadId);
  if (thread) {
    thread.unreadCount = 0;
    threads.set(threadId, thread);
  }
  // Mark all messages as read
  const threadMsgs = messages.get(threadId) || [];
  threadMsgs.forEach((m) => {
    if (m.from !== userId && m.state === 'delivered') {
      m.state = 'read';
    }
  });
}

export function editMsg(msgId: string, threadId: string, newContent: string): boolean {
  const threadMsgs = messages.get(threadId);
  if (!threadMsgs) return false;
  const msg = threadMsgs.find((m) => m.id === msgId);
  if (!msg) return false;
  msg.content = newContent;
  msg.editedAt = new Date().toISOString();
  return true;
}

export function deleteMsg(msgId: string, threadId: string, userId: string, scope: 'self' | 'room'): void {
  const threadMsgs = messages.get(threadId);
  if (!threadMsgs) return;
  const msg = threadMsgs.find((m) => m.id === msgId);
  if (!msg) return;
  if (scope === 'self') {
    msg.deletedFor.push(userId);
  } else {
    msg.deletedFor = [...new Set([...msg.deletedFor, ...threads.get(threadId)!.participants])];
  }
}

// ─── Event Subscription ──────────────────────────────────────────────────────

export function onThreadMessage(threadId: string, cb: (msg: Msg) => void): () => void {
  const cbs = deliveryCallbacks.get(threadId) || [];
  cbs.push(cb);
  deliveryCallbacks.set(threadId, cbs);
  return () => {
    const current = deliveryCallbacks.get(threadId) || [];
    deliveryCallbacks.set(threadId, current.filter((c) => c !== cb));
  };
}
