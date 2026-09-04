import { describe, it, expect } from 'vitest';
import {
  miActionSchema,
  serializeMiAction,
  deserializeMiAction,
  type MiAction,
} from '../../protocol/action';

describe('MiAction Envelope', () => {
  const validAction: MiAction = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    version: '1.0',
    actor: {
      did: 'did:example:123',
      role: 'citizen',
      is_helper: false,
    },
    intent: {
      action_type: 'vote',
      purpose: 'Vote on proposal #1',
      payload: { proposal_id: 'prop-1', choice: 'yes' },
    },
    scope: {
      geo_scope: 'city',
      visibility: 'public',
    },
    receipt: {
      id: '987e6543-e21b-12d3-a456-426614174999',
      timestamp: '2023-10-01T12:00:00Z',
      status: 'completed',
    },
    appealPath: {
      route: 'peer_review',
      deadline_hours: 48,
    },
    offlineSync: {
      created_offline: true,
      conflict_rule: 'last_write_wins',
      max_offline_hours: 24,
    },
  };

  describe('Schema Validation', () => {
    it('should validate a complete and valid MiAction', () => {
      const result = miActionSchema.safeParse(validAction);
      expect(result.success).toBe(true);
    });

    it('should fail validation if missing required fields', () => {
      const invalidAction = { ...validAction, actor: undefined };
      const result = miActionSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it('should fail validation with invalid uuid', () => {
      const invalidAction = { ...validAction, id: 'invalid-uuid' };
      const result = miActionSchema.safeParse(invalidAction);
      expect(result.success).toBe(false);
    });

    it('should fail validation with invalid enum value', () => {
       const invalidAction = { ...validAction, scope: { ...validAction.scope, visibility: 'invalid' } };
       const result = miActionSchema.safeParse(invalidAction);
       expect(result.success).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize a valid MiAction to JSON', () => {
      const jsonStr = serializeMiAction(validAction);
      expect(typeof jsonStr).toBe('string');
      expect(jsonStr).toContain('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw an error during serialization if MiAction is invalid', () => {
      const invalidAction = { ...validAction, id: 'invalid' } as MiAction;
      expect(() => serializeMiAction(invalidAction)).toThrow();
    });
  });

  describe('Deserialization', () => {
    it('should deserialize a valid JSON string to MiAction', () => {
      const jsonStr = JSON.stringify(validAction);
      const deserialized = deserializeMiAction(jsonStr);
      expect(deserialized).toEqual(validAction);
    });

    it('should throw an error during deserialization if JSON is invalid MiAction', () => {
      const invalidJsonStr = JSON.stringify({ ...validAction, version: '2.0' });
      expect(() => deserializeMiAction(invalidJsonStr)).toThrow();
    });

    it('should throw an error during deserialization if JSON is malformed', () => {
      expect(() => deserializeMiAction('{"bad": json')).toThrow();
    });
  });
});
