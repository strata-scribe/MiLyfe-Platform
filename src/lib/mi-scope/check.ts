import type {
  ScopeCheckRequest,
  ScopeCheckResult,
  Permission,
  ResourceType,
} from './types';

/**
 * MiScope Permission Check
 *
 * MVP implementation: rule-based permission checking.
 * Designed to be replaced with OpenFGA calls at scale.
 */

// Default permission matrix (who can do what by default)
const DEFAULT_PERMISSIONS: Record<
  ResourceType,
  Record<Permission, PermissionRule>
> = {
  profile: {
    view: { default: 'allow', reason: 'Profiles are public by default' },
    edit: { default: 'owner_only', reason: 'Only owner can edit profile' },
    delete: { default: 'owner_only', reason: 'Only owner can delete profile' },
    transfer: { default: 'deny', reason: 'Profiles cannot be transferred' },
    approve: { default: 'deny', reason: 'N/A' },
    appeal: { default: 'allow', reason: 'Anyone can appeal' },
    moderate: { default: 'role_required', reason: 'Requires keeper role' },
    create: { default: 'deny', reason: 'Created at signup only' },
  },
  pocket: {
    view: { default: 'owner_only', reason: 'Wallet is private' },
    edit: { default: 'deny', reason: 'Wallet edited through transactions only' },
    delete: { default: 'deny', reason: 'Wallet cannot be deleted' },
    transfer: { default: 'owner_only', reason: 'Only owner can send $MLY' },
    approve: { default: 'deny', reason: 'N/A' },
    appeal: { default: 'allow', reason: 'Can appeal pocket actions' },
    moderate: { default: 'role_required', reason: 'Requires keeper for freeze' },
    create: { default: 'deny', reason: 'Created at signup only' },
  },
  location: {
    view: { default: 'deny', reason: 'Location private by default' },
    edit: { default: 'owner_only', reason: 'Only owner controls location' },
    delete: { default: 'owner_only', reason: 'Owner can purge location' },
    transfer: { default: 'deny', reason: 'N/A' },
    approve: { default: 'deny', reason: 'N/A' },
    appeal: { default: 'deny', reason: 'N/A' },
    moderate: { default: 'deny', reason: 'Location cannot be moderated' },
    create: { default: 'deny', reason: 'N/A' },
  },
  messages: {
    view: { default: 'participants_only', reason: 'Only conversation participants' },
    edit: { default: 'deny', reason: 'Messages are immutable' },
    delete: { default: 'owner_only', reason: 'Sender can delete own message' },
    transfer: { default: 'deny', reason: 'N/A' },
    approve: { default: 'deny', reason: 'N/A' },
    appeal: { default: 'allow', reason: 'Can appeal message moderation' },
    moderate: { default: 'role_required', reason: 'Requires keeper role' },
    create: { default: 'allow', reason: 'Any member can send messages' },
  },
  learn_progress: {
    view: { default: 'owner_only', reason: 'Learning progress is private' },
    edit: { default: 'owner_only', reason: 'Only learner updates progress' },
    delete: { default: 'deny', reason: 'Progress cannot be deleted' },
    transfer: { default: 'deny', reason: 'N/A' },
    approve: { default: 'role_required', reason: 'Teachers can approve completions' },
    appeal: { default: 'allow', reason: 'Can appeal assessment decisions' },
    moderate: { default: 'deny', reason: 'N/A' },
    create: { default: 'owner_only', reason: 'System creates on enrollment' },
  },
  health_data: {
    view: { default: 'owner_only', reason: 'Health data is intimate/private' },
    edit: { default: 'owner_only', reason: 'Only owner edits health data' },
    delete: { default: 'owner_only', reason: 'Owner can delete health data' },
    transfer: { default: 'deny', reason: 'Health data cannot be transferred' },
    approve: { default: 'deny', reason: 'N/A' },
    appeal: { default: 'deny', reason: 'N/A' },
    moderate: { default: 'deny', reason: 'Health data cannot be moderated' },
    create: { default: 'owner_only', reason: 'Only owner creates health data' },
  },
  safety_case: {
    view: { default: 'deny', reason: 'Safety cases restricted to reviewers' },
    edit: { default: 'deny', reason: 'Safety cases are append-only' },
    delete: { default: 'deny', reason: 'Safety cases cannot be deleted' },
    transfer: { default: 'deny', reason: 'N/A' },
    approve: { default: 'role_required', reason: 'Keeper reviews safety cases' },
    appeal: { default: 'allow', reason: 'Can appeal safety decisions' },
    moderate: { default: 'role_required', reason: 'Keeper only' },
    create: { default: 'allow', reason: 'Anyone can file a safety report' },
  },
  proposal: {
    view: { default: 'allow', reason: 'Proposals are public' },
    edit: { default: 'owner_only', reason: 'Author edits before submission' },
    delete: { default: 'owner_only', reason: 'Author can withdraw draft' },
    transfer: { default: 'deny', reason: 'N/A' },
    approve: { default: 'allow', reason: 'Members vote on proposals' },
    appeal: { default: 'allow', reason: 'Can appeal governance decisions' },
    moderate: { default: 'role_required', reason: 'Steward moderates proposals' },
    create: { default: 'allow', reason: 'Any member can propose' },
  },
  marketplace_listing: {
    view: { default: 'allow', reason: 'Listings are public' },
    edit: { default: 'owner_only', reason: 'Seller edits their listing' },
    delete: { default: 'owner_only', reason: 'Seller can remove listing' },
    transfer: { default: 'deny', reason: 'N/A' },
    approve: { default: 'deny', reason: 'N/A' },
    appeal: { default: 'allow', reason: 'Can appeal listing removal' },
    moderate: { default: 'role_required', reason: 'Keeper can remove listings' },
    create: { default: 'allow', reason: 'Any member can list items' },
  },
  quest: {
    view: { default: 'allow', reason: 'Quests are public' },
    edit: { default: 'owner_only', reason: 'Creator edits quest' },
    delete: { default: 'owner_only', reason: 'Creator can cancel quest' },
    transfer: { default: 'deny', reason: 'N/A' },
    approve: { default: 'role_required', reason: 'Verifier approves completion' },
    appeal: { default: 'allow', reason: 'Can appeal quest denial' },
    moderate: { default: 'role_required', reason: 'Steward can moderate quests' },
    create: { default: 'allow', reason: 'Any member can create quests' },
  },
};

interface PermissionRule {
  default: 'allow' | 'deny' | 'owner_only' | 'participants_only' | 'role_required';
  reason: string;
}

/**
 * Check if an actor has permission to perform an action on a resource.
 */
export async function checkPermission(
  request: ScopeCheckRequest,
): Promise<ScopeCheckResult> {
  const { actor_id, permission, resource_type, resource_owner_id, context } =
    request;

  // Get the rule for this resource type + permission
  const rule = DEFAULT_PERMISSIONS[resource_type]?.[permission];
  if (!rule) {
    return {
      allowed: false,
      reason: 'no_rule',
      explanation: `No permission rule defined for ${resource_type}.${permission}`,
    };
  }

  // --- Non-negotiable safety checks ---

  // Helpers cannot access safety cases
  if (context?.is_helper && resource_type === 'safety_case') {
    return {
      allowed: false,
      reason: 'helper_safety_denied',
      policy_ref: 'rail.6',
      explanation: 'AI helpers cannot access safety case details',
    };
  }

  // Children cannot access certain resources
  if (context?.is_child && resource_type === 'marketplace_listing' && permission === 'create') {
    return {
      allowed: false,
      reason: 'child_marketplace_denied',
      policy_ref: 'compact.5',
      explanation: 'Members under money-age cannot create marketplace listings',
    };
  }

  // --- Apply default rules ---

  switch (rule.default) {
    case 'allow':
      return {
        allowed: true,
        reason: 'default_allow',
        explanation: rule.reason,
      };

    case 'deny':
      return {
        allowed: false,
        reason: 'default_deny',
        explanation: rule.reason,
      };

    case 'owner_only':
      if (actor_id === resource_owner_id) {
        return {
          allowed: true,
          reason: 'is_owner',
          explanation: 'You own this resource',
        };
      }
      return {
        allowed: false,
        reason: 'not_owner',
        explanation: rule.reason,
      };

    case 'participants_only':
      // For MVP, this is handled by Supabase RLS
      // Here we just confirm the actor is one of the participants
      // In production, this would query the relationship graph
      return {
        allowed: true, // Supabase RLS is the real gate
        reason: 'rls_enforced',
        explanation: 'Access controlled by database row-level security',
      };

    case 'role_required':
      // Check if actor has the required role
      // For MVP, we check the profiles.role column
      // In production, this would be an OpenFGA relationship check
      return {
        allowed: false,
        reason: 'role_check_needed',
        explanation: `This action requires a specific role. ${rule.reason}`,
      };

    default:
      return {
        allowed: false,
        reason: 'unknown_rule',
        explanation: 'Permission rule not recognized',
      };
  }
}

/**
 * Check permission with role override (for server-side use)
 */
export async function checkPermissionWithRole(
  request: ScopeCheckRequest,
  actorRole: string,
): Promise<ScopeCheckResult> {
  const baseResult = await checkPermission(request);

  // If base check passed, return it
  if (baseResult.allowed) return baseResult;

  // If denied because role_required, check if actor has the role
  if (baseResult.reason === 'role_check_needed') {
    const requiredRoles: Record<string, string[]> = {
      moderate: ['moderator', 'keeper', 'steward', 'admin'],
      approve: ['teacher', 'keeper', 'steward', 'admin'],
    };

    const allowed = requiredRoles[request.permission]?.includes(actorRole) ?? false;

    if (allowed) {
      return {
        allowed: true,
        reason: 'role_granted',
        explanation: `Permitted: actor has ${actorRole} role`,
      };
    }
  }

  return baseResult;
}
