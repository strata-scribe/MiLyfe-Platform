import type {
  PreviewRequest,
  PreviewResult,
  PreviewField,
  ResourceType,
} from './types';
import { checkPermission } from './check';

/**
 * "What Can This Person See?" Preview
 *
 * Given a viewer and a target, returns what data the viewer can access.
 * This powers the privacy display: "Right now, 0 people can see your location"
 */
export async function previewAccess(
  request: PreviewRequest,
): Promise<PreviewResult> {
  const { viewer_id, target_id, resource_types } = request;

  const result: Partial<PreviewResult> = {};

  for (const resourceType of resource_types) {
    const field = await checkResourceVisibility(viewer_id, target_id, resourceType);
    result[resourceType] = field;
  }

  return result as PreviewResult;
}

async function checkResourceVisibility(
  viewer_id: string,
  target_id: string,
  resource_type: ResourceType,
): Promise<PreviewField> {
  // Self-view: always full access
  if (viewer_id === target_id) {
    return {
      visible: true,
      fields: ['all'],
      scope: 'full',
    };
  }

  const check = await checkPermission({
    actor_id: viewer_id,
    permission: 'view',
    resource_type,
    resource_owner_id: target_id,
  });

  if (!check.allowed) {
    return {
      visible: false,
      reason: check.explanation,
    };
  }

  // Resource-specific field visibility
  switch (resource_type) {
    case 'profile':
      return {
        visible: true,
        fields: ['display_name', 'username', 'avatar_url', 'bio', 'neighborhood'],
        scope: 'public_fields',
      };

    case 'pocket':
      return {
        visible: false,
        reason: 'Wallet balances are private. Only visible to owner and household members.',
      };

    case 'location':
      return {
        visible: false,
        reason: 'Location sharing is disabled by default',
      };

    case 'messages':
      return {
        visible: true,
        scope: 'direct_threads_only',
      };

    case 'learn_progress':
      return {
        visible: false,
        reason: 'Learning progress is private by default',
      };

    case 'health_data':
      return {
        visible: false,
        reason: 'Health data is always private',
      };

    default:
      return {
        visible: check.allowed,
        reason: check.explanation,
      };
  }
}

/**
 * Get a privacy summary for a member (shown in "You" tab)
 *
 * Returns counts like: "Right now, 0 people can see your location"
 */
export interface PrivacySummary {
  location_viewers: number;
  pocket_viewers: number;
  health_viewers: number;
  message_contacts: number;
  profile_visibility: 'public' | 'place' | 'connections_only';
}

export async function getPrivacySummary(member_id: string): Promise<PrivacySummary> {
  // MVP: return safe defaults
  // In production: query relationship graph for actual counts
  return {
    location_viewers: 0,
    pocket_viewers: 1, // just themselves
    health_viewers: 1, // just themselves
    message_contacts: 0, // would count accepted connections
    profile_visibility: 'public',
  };
}
