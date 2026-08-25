/**
 * MiScope — Permission Graph (MVP Implementation)
 *
 * For the MVP, we implement MiScope as a TypeScript permission layer
 * on top of Supabase RLS. The interface is designed to be compatible
 * with OpenFGA, so we can swap the backend later without changing callers.
 */

// ---------- Relationship Types ----------

export type RelationshipType =
  | 'member_of'
  | 'guardian_of'
  | 'steward_of'
  | 'keeper_of'
  | 'teacher_of'
  | 'mediator_for'
  | 'helper_operator'
  | 'recovery_contact'
  | 'temporary_access'
  | 'shop_staff'
  | 'connected_to'
  | 'blocked_by';

export type ResourceType =
  | 'profile'
  | 'pocket'
  | 'location'
  | 'messages'
  | 'learn_progress'
  | 'health_data'
  | 'safety_case'
  | 'proposal'
  | 'marketplace_listing'
  | 'quest';

export type Permission =
  | 'view'
  | 'edit'
  | 'delete'
  | 'transfer'
  | 'approve'
  | 'appeal'
  | 'moderate'
  | 'create';

// ---------- Check Request/Response ----------

export interface ScopeCheckRequest {
  /** Who is trying to do the action */
  actor_id: string;
  /** What they're trying to do */
  permission: Permission;
  /** What type of resource */
  resource_type: ResourceType;
  /** Specific resource ID (optional — for object-level checks) */
  resource_id?: string;
  /** Owner of the resource */
  resource_owner_id?: string;
  /** Additional context */
  context?: {
    is_helper?: boolean;
    is_child?: boolean;
    sensitivity?: string;
    place_id?: string;
  };
}

export interface ScopeCheckResult {
  allowed: boolean;
  reason: string;
  /** Which policy/rule made the decision */
  policy_ref?: string;
  /** Human-readable explanation */
  explanation: string;
}

// ---------- Preview Request/Response ----------

export interface PreviewRequest {
  viewer_id: string;
  target_id: string;
  resource_types: ResourceType[];
}

export interface PreviewField {
  visible: boolean;
  fields?: string[];
  scope?: string;
  reason?: string;
}

export type PreviewResult = Record<ResourceType, PreviewField>;

// ---------- Relationship ----------

export interface Relationship {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: RelationshipType;
  /** ISO datetime when this relationship expires (null = permanent) */
  expires_at: string | null;
  /** Place/scope where this relationship is valid */
  scope?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  created_at: string;
}
