import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleNameChange,
  handleHouseholdMerge,
  handleSeparation,
  handleBereavement
} from './events';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase Client
const mockSupabase = {
  from: vi.fn(),
} as unknown as SupabaseClient<any>;

describe('identity events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleNameChange', () => {
    it('updates display_name correctly when provided a preferred name', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: { metadata: {} }, error: null });
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: selectMock,
        update: updateMock,
      });

      const result = await handleNameChange(mockSupabase, 'user123', { preferred: 'Jules' });
      expect(result.success).toBe(true);
      expect(result.displayName).toBe('Jules');

      // First call for select
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');

      // Update assertions
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        display_name: 'Jules'
      }));
    });
  });

  describe('handleHouseholdMerge', () => {
    it('inserts mutual relationships', async () => {
      const checkSingleMock = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const checkEq3Mock = vi.fn().mockReturnValue({ single: checkSingleMock });
      const checkEq2Mock = vi.fn().mockReturnValue({ eq: checkEq3Mock });
      const checkEq1Mock = vi.fn().mockReturnValue({ eq: checkEq2Mock });
      const selectMock = vi.fn().mockReturnValue({ eq: checkEq1Mock });

      const insertMock = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'relationships') {
          return {
            select: selectMock,
            insert: insertMock,
          };
        }
      });

      const result = await handleHouseholdMerge(mockSupabase, 'user1', 'user2');

      expect(result.success).toBe(true);
      expect(insertMock).toHaveBeenCalledTimes(1);
      const insertedData = insertMock.mock.calls[0][0];
      expect(insertedData.length).toBe(2);
      expect(insertedData[0].from_user_id).toBe('user1');
      expect(insertedData[0].to_user_id).toBe('user2');
      expect(insertedData[1].from_user_id).toBe('user2');
      expect(insertedData[1].to_user_id).toBe('user1');
    });
  });

  describe('handleSeparation', () => {
    it('deletes active relationships between users', async () => {
      const orMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ or: orMock });

      mockSupabase.from = vi.fn().mockReturnValue({ delete: deleteMock });

      const result = await handleSeparation(mockSupabase, 'u1', 'u2');
      expect(result.success).toBe(true);
      expect(orMock).toHaveBeenCalledWith('and(from_user_id.eq.u1,to_user_id.eq.u2),and(from_user_id.eq.u2,to_user_id.eq.u1)');
    });
  });

  describe('handleBereavement', () => {
    it('updates profile metadata and deletes relationships', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: { metadata: {} }, error: null });
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

      const orMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ or: orMock });

      mockSupabase.from = vi.fn().mockImplementation((table) => {
        if (table === 'profiles') {
          return { select: selectMock, update: updateMock };
        }
        if (table === 'relationships') {
          return { delete: deleteMock };
        }
      });

      const result = await handleBereavement(mockSupabase, 'deceased-user');
      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({ deceased: true })
      }));
      expect(orMock).toHaveBeenCalledWith('from_user_id.eq.deceased-user,to_user_id.eq.deceased-user');
    });
  });
});
