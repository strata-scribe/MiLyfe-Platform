import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { WalkEngine, WalkDatabase, VectorClockComparison } from '../walk';
import { MiAction } from '../action';
import { v4 as uuidv4 } from 'uuid';

describe('WalkEngine Offline Action Queue', () => {
  let engine: WalkEngine;
  let db: WalkDatabase;

  const mockActionTemplate: Omit<MiAction, 'id'> = {
    version: '1.0',
    actor: {
      did: 'did:milyfe:test',
      role: 'neighbor',
      is_helper: false,
    },
    intent: {
      action_type: 'test_action',
      purpose: 'testing offline queue',
      payload: { foo: 'bar' },
    },
    scope: {
      visibility: 'public',
    },
    receipt: {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: 'pending',
    },
  };

  beforeEach(async () => {
    db = new WalkDatabase();
    engine = new WalkEngine(db);
    await engine.clearQueue();
  });

  describe('Queueing', () => {
    it('should enqueue actions and retrieve them in order', async () => {
      const action1: MiAction = { ...mockActionTemplate, id: uuidv4() };
      const action2: MiAction = { ...mockActionTemplate, id: uuidv4() };

      await engine.enqueue(action1);
      // Ensure slight delay for queuedAt order
      await new Promise(r => setTimeout(r, 10));
      await engine.enqueue(action2);

      const queue = await engine.getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].id).toBe(action1.id);
      expect(queue[1].id).toBe(action2.id);
    });

    it('should remove actions from queue', async () => {
      const action: MiAction = { ...mockActionTemplate, id: uuidv4() };
      await engine.enqueue(action);

      let queue = await engine.getQueue();
      expect(queue).toHaveLength(1);

      await engine.removeFromQueue(action.id);

      queue = await engine.getQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('Vector Clocks', () => {
    it('should correctly compare equal vector clocks', () => {
      const vc1 = { nodeA: 1, nodeB: 2 };
      const vc2 = { nodeA: 1, nodeB: 2 };
      expect(engine.compareVectorClocks(vc1, vc2)).toBe(VectorClockComparison.EQUAL);
    });

    it('should correctly identify local wins', () => {
      const vc1 = { nodeA: 2, nodeB: 2 };
      const vc2 = { nodeA: 1, nodeB: 2 };
      expect(engine.compareVectorClocks(vc1, vc2)).toBe(VectorClockComparison.LOCAL_WINS);
    });

    it('should correctly identify server wins', () => {
      const vc1 = { nodeA: 1, nodeB: 2 };
      const vc2 = { nodeA: 1, nodeB: 3 };
      expect(engine.compareVectorClocks(vc1, vc2)).toBe(VectorClockComparison.SERVER_WINS);
    });

    it('should correctly identify concurrent clocks', () => {
      const vc1 = { nodeA: 2, nodeB: 1 };
      const vc2 = { nodeA: 1, nodeB: 2 };
      expect(engine.compareVectorClocks(vc1, vc2)).toBe(VectorClockComparison.CONCURRENT);
    });

    it('should correctly merge vector clocks', () => {
      const vc1 = { nodeA: 2, nodeB: 1, nodeC: 1 };
      const vc2 = { nodeA: 1, nodeB: 2, nodeD: 1 };
      const merged = engine.mergeVectorClocks(vc1, vc2);
      expect(merged).toEqual({ nodeA: 2, nodeB: 2, nodeC: 1, nodeD: 1 });
    });
  });

  describe('Conflict Resolution', () => {
    it('should use last_write_wins rule correctly', () => {
      const local: MiAction = {
        ...mockActionTemplate,
        id: '1',
        offlineSync: { conflict_rule: 'last_write_wins', created_offline: true }
      };
      const server: MiAction = {
        ...mockActionTemplate,
        id: '1',
        offlineSync: { conflict_rule: 'last_write_wins', created_offline: false }
      };

      const resolved = engine.resolveConflict(local, server);
      expect(resolved).toBe(local);
    });

    it('should use first_write_wins rule correctly', () => {
      const local: MiAction = {
        ...mockActionTemplate,
        id: '1',
        offlineSync: { conflict_rule: 'first_write_wins', created_offline: true }
      };
      const server: MiAction = {
        ...mockActionTemplate,
        id: '1',
        offlineSync: { conflict_rule: 'first_write_wins', created_offline: false }
      };

      const resolved = engine.resolveConflict(local, server);
      expect(resolved).toBe(server);
    });

    it('should merge payloads correctly', () => {
       const local: MiAction = {
        ...mockActionTemplate,
        id: '1',
        intent: { ...mockActionTemplate.intent, payload: { a: '1', b: '2' } },
        offlineSync: { conflict_rule: 'merge', vector_clock: { nodeA: 2 } }
      };
      const server: MiAction = {
        ...mockActionTemplate,
        id: '1',
        intent: { ...mockActionTemplate.intent, payload: { b: '3', c: '4' } },
         offlineSync: { conflict_rule: 'merge', vector_clock: { nodeB: 2 } }
      };

      const resolved = engine.resolveConflict(local, server);
      expect(resolved?.offlineSync?.conflict_rule).toBe('merge');
      expect(resolved?.offlineSync?.vector_clock).toEqual({ nodeA: 2, nodeB: 2 });
      expect(resolved?.intent.payload).toEqual({ a: '1', b: '2', c: '4' }); // local overrides server for b
    });
  });

  describe('Sync', () => {
    it('should process sync with no conflicts and update timestamps', async () => {
      const actionId = uuidv4();
      const localAction: MiAction = { ...mockActionTemplate, id: actionId };
      await engine.enqueue(localAction);

      const serverTimestamp = '2023-10-27T10:00:00Z';
      const resolved = await engine.sync([], serverTimestamp);

      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe(actionId);
      expect(resolved[0].receipt?.timestamp).toBe(serverTimestamp);

      const queue = await engine.getQueue();
      expect(queue).toHaveLength(0); // removed from queue
    });

    it('should handle concurrent changes and resolve', async () => {
      const actionId = uuidv4();
      const localAction: MiAction = {
        ...mockActionTemplate,
        id: actionId,
        offlineSync: { conflict_rule: 'last_write_wins', vector_clock: { client: 2, server: 1 } }
      };
      await engine.enqueue(localAction);

      const serverAction: MiAction = {
         ...mockActionTemplate,
        id: actionId,
        offlineSync: { conflict_rule: 'last_write_wins', vector_clock: { client: 1, server: 2 } }
      }

      const serverTimestamp = '2023-10-27T10:00:00Z';
      const resolved = await engine.sync([serverAction], serverTimestamp);

      // Concurrent so it uses resolveConflict, which is LWW -> keeps local
      expect(resolved).toHaveLength(1);
      expect(resolved[0].id).toBe(actionId);
      expect(resolved[0].receipt?.timestamp).toBe(serverTimestamp);

      const queue = await engine.getQueue();
      expect(queue).toHaveLength(0);
    });

    it('should discard local action if server wins', async () => {
      const actionId = uuidv4();
      const localAction: MiAction = {
        ...mockActionTemplate,
        id: actionId,
        offlineSync: { vector_clock: { client: 1 } }
      };
      await engine.enqueue(localAction);

      const serverAction: MiAction = {
         ...mockActionTemplate,
        id: actionId,
        offlineSync: { vector_clock: { client: 2 } } // server has newer client state? Or strictly greater
      }

      const serverTimestamp = '2023-10-27T10:00:00Z';
      const resolved = await engine.sync([serverAction], serverTimestamp);

      expect(resolved).toHaveLength(1);
      expect(resolved[0]).toEqual(serverAction); // Server won

      const queue = await engine.getQueue();
      expect(queue).toHaveLength(0);
    });
  });
});
