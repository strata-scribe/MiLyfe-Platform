export type CircleType = 'family' | 'neighbors' | 'collaborators';

export type MemberRole = 'admin' | 'member' | 'guest';

export type Permission =
  | 'view_profiles'
  | 'share_resources'
  | 'invite_members'
  | 'manage_circle'
  | 'manage_members';

export interface CircleMember {
  userId: string;
  role: MemberRole;
  joinedAt: Date;
}

export interface TrustCircle {
  id: string;
  name: string;
  type: CircleType;
  members: CircleMember[];
  sharedSecretKey: string; // Base64 encoded or hex exported key
  createdAt: Date;
}

export interface InvitationToken {
  token: string;
  circleId: string;
  role: MemberRole;
  expiresAt: Date;
}

/**
 * Generates a shared secret key for a trust circle using AES-GCM.
 * Exports the key as a raw Buffer/ArrayBuffer, then encodes to base64.
 */
export async function generateSecretKey(): Promise<string> {
  const key = await globalThis.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  const exported = await globalThis.crypto.subtle.exportKey('raw', key);

  // Convert ArrayBuffer to Base64
  const bytes = new Uint8Array(exported);
  const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
  return btoa(binary);
}

/**
 * Creates a new trust circle with an initial admin member.
 */
/**
 * Permissions boundaries for different roles.
 */
export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  admin: [
    'view_profiles',
    'share_resources',
    'invite_members',
    'manage_circle',
    'manage_members',
  ],
  member: [
    'view_profiles',
    'share_resources',
    'invite_members',
  ],
  guest: [
    'view_profiles',
  ],
};

/**
 * Checks if a role has a specific permission.
 */
export function hasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Generates an invitation token for a circle.
 * Only members with the 'invite_members' permission can generate invitations.
 */
export function generateInvite(
  circleId: string,
  inviterRole: MemberRole,
  assignRole: MemberRole = 'member',
  expiresInMs: number = 24 * 60 * 60 * 1000 // default 24 hours
): InvitationToken {
  if (!hasPermission(inviterRole, 'invite_members')) {
    throw new Error('Insufficient permissions to invite members');
  }

  // Admins can invite anyone. Members can only invite members or guests. Guests cannot invite.
  if (inviterRole === 'member' && assignRole === 'admin') {
     throw new Error('Members cannot invite admins');
  }

  return {
    token: globalThis.crypto.randomUUID(),
    circleId,
    role: assignRole,
    expiresAt: new Date(Date.now() + expiresInMs),
  };
}

/**
 * Joins a circle using an invitation token.
 * Validates the token expiration. In a real system, this would also validate token existence in a DB.
 */
export function joinCircle(
  circle: TrustCircle,
  inviteToken: InvitationToken,
  userId: string
): TrustCircle {
  if (inviteToken.circleId !== circle.id) {
    throw new Error('Invalid invitation token for this circle');
  }

  if (new Date() > inviteToken.expiresAt) {
    throw new Error('Invitation token has expired');
  }

  const existingMember = circle.members.find(m => m.userId === userId);
  if (existingMember) {
    throw new Error('User is already a member of this circle');
  }

  const newMember: CircleMember = {
    userId,
    role: inviteToken.role,
    joinedAt: new Date(),
  };

  return {
    ...circle,
    members: [...circle.members, newMember],
  };
}

export async function createCircle(
  name: string,
  type: CircleType,
  creatorUserId: string
): Promise<TrustCircle> {
  const sharedSecretKey = await generateSecretKey();

  return {
    id: globalThis.crypto.randomUUID(),
    name,
    type,
    sharedSecretKey,
    createdAt: new Date(),
    members: [
      {
        userId: creatorUserId,
        role: 'admin',
        joinedAt: new Date(),
      }
    ]
  };
}
