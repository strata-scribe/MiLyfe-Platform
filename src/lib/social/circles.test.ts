import { describe, it, expect } from 'vitest';
import {
  createCircle,
  generateInvite,
  joinCircle,
  hasPermission,
  generateSecretKey,
  TrustCircle,
  InvitationToken
} from './circles';

describe('Trust Circles', () => {

  describe('Cryptographic Key Creation', () => {
    it('should generate a valid base64 shared secret key', async () => {
      const key = await generateSecretKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      // Simple base64 regex check
      expect(/^[A-Za-z0-9+/]+={0,2}$/.test(key)).toBe(true);
    });

    it('should generate unique keys', async () => {
      const key1 = await generateSecretKey();
      const key2 = await generateSecretKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('Circle Creation', () => {
    it('should create a new circle with admin member and secret key', async () => {
      const creatorId = 'user-123';
      const circle = await createCircle('My Family', 'family', creatorId);

      expect(circle.id).toBeDefined();
      expect(circle.name).toBe('My Family');
      expect(circle.type).toBe('family');
      expect(circle.sharedSecretKey).toBeDefined();
      expect(circle.members).toHaveLength(1);
      expect(circle.members[0].userId).toBe(creatorId);
      expect(circle.members[0].role).toBe('admin');
    });
  });

  describe('Role-based Permissions', () => {
    it('admin should have all necessary permissions', () => {
      expect(hasPermission('admin', 'invite_members')).toBe(true);
      expect(hasPermission('admin', 'manage_circle')).toBe(true);
    });

    it('member should have limited permissions', () => {
      expect(hasPermission('member', 'invite_members')).toBe(true);
      expect(hasPermission('member', 'manage_circle')).toBe(false);
    });

    it('guest should only have view permissions', () => {
      expect(hasPermission('guest', 'view_profiles')).toBe(true);
      expect(hasPermission('guest', 'invite_members')).toBe(false);
      expect(hasPermission('guest', 'share_resources')).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('admin can generate invite tokens for members', () => {
      const token = generateInvite('circle-1', 'admin', 'member');
      expect(token).toBeDefined();
      expect(token.role).toBe('member');
      expect(token.circleId).toBe('circle-1');
    });

    it('admin can generate invite tokens for admins', () => {
      const token = generateInvite('circle-1', 'admin', 'admin');
      expect(token).toBeDefined();
      expect(token.role).toBe('admin');
    });

    it('member can generate invite tokens for members', () => {
      const token = generateInvite('circle-1', 'member', 'member');
      expect(token).toBeDefined();
      expect(token.role).toBe('member');
    });

    it('member cannot generate invite tokens for admins', () => {
      expect(() => generateInvite('circle-1', 'member', 'admin'))
        .toThrowError('Members cannot invite admins');
    });

    it('guest cannot generate invite tokens', () => {
      expect(() => generateInvite('circle-1', 'guest', 'member'))
        .toThrowError('Insufficient permissions to invite members');
    });
  });

  describe('Joining Circles', () => {
    let circle: TrustCircle;

    it('should successfully join a circle with a valid token', async () => {
      circle = await createCircle('Collaborators', 'collaborators', 'user-1');
      const token = generateInvite(circle.id, 'admin', 'member');

      const newCircle = joinCircle(circle, token, 'user-2');

      expect(newCircle.members).toHaveLength(2);
      expect(newCircle.members[1].userId).toBe('user-2');
      expect(newCircle.members[1].role).toBe('member');
    });

    it('should fail if token is for a different circle', async () => {
      circle = await createCircle('Neighbors', 'neighbors', 'user-1');
      const token = generateInvite('different-circle-id', 'admin', 'member');

      expect(() => joinCircle(circle, token, 'user-2'))
        .toThrowError('Invalid invitation token for this circle');
    });

    it('should fail if token is expired', async () => {
      circle = await createCircle('Family', 'family', 'user-1');
      const token = generateInvite(circle.id, 'admin', 'member', -1000); // Expired 1 second ago

      expect(() => joinCircle(circle, token, 'user-2'))
        .toThrowError('Invitation token has expired');
    });

    it('should fail if user is already a member', async () => {
      circle = await createCircle('Family', 'family', 'user-1');
      const token = generateInvite(circle.id, 'admin', 'member');

      const newCircle = joinCircle(circle, token, 'user-2');

      expect(() => joinCircle(newCircle, token, 'user-2'))
        .toThrowError('User is already a member of this circle');
    });
  });
});
