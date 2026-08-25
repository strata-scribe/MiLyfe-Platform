/**
 * MiAction — Common Human-Action Envelope
 *
 * Every consequential action in MiLyfe travels inside this envelope.
 * This is the universal unit of coordination across all OS layers.
 */

// ---------- Enums ----------

export type ActionState =
  | 'draft'
  | 'pending_approval'
  | 'walking'
  | 'sent'
  | 'arrived'
  | 'executed'
  | 'failed'
  | 'expired'
  | 'reversed'
  | 'appealed';

export type Visibility =
  | 'self'
  | 'named'
  | 'household'
  | 'circle'
  | 'place'
  | 'federation'
  | 'public';

export type Sensitivity =
  | 'public'
  | 'community'
  | 'private'
  | 'intimate'
  | 'safety_critical';

export type GeoScope =
  | 'block'
  | 'neighborhood'
  | 'city'
  | 'region'
  | 'global';

export type ConflictRule =
  | 'last_write_wins'
  | 'first_write_wins'
  | 'merge'
  | 'human_review'
  | 'reject_later'
  | 'reservation';

export type ExpiryBehavior =
  | 'void'
  | 'archive'
  | 'escalate'
  | 'auto_approve';

export type AppealRoute =
  | 'peer_review'
  | 'circle_panel'
  | 'place_mediator'
  | 'federation_ombuds'
  | 'fork';

// ---------- Sub-types ----------

export interface ActionActor {
  /** User ID or DID */
  did: string;
  /** Role under which action is performed */
  role: string;
  /** Originating device ID (for offline conflict resolution) */
  device_id?: string;
  /** True if actor is an AI helper */
  is_helper: boolean;
}

export interface ActionPlace {
  /** MiLyfe instance ID */
  instance_id: string;
  /** Geographic scope */
  geo_scope?: GeoScope;
  /** Optional coordinates (only when action requires location proof) */
  coordinates?: {
    lat: number;
    lon: number;
    accuracy_m?: number;
  };
}

export interface ActionJurisdiction {
  /** Semantic version of applicable MiLegal pack */
  law_pack_version: string;
  /** ISO 3166-1 alpha-2 country code */
  country_code?: string;
  /** State/province/city subdivision */
  subdivision?: string;
  /** Specific rule overrides */
  overrides?: string[];
}

export interface ActionAudience {
  /** Who can see this action and its result */
  visibility: Visibility;
  /** Specific recipient DIDs (when visibility=named) */
  named_recipients?: string[];
  /** DIDs explicitly excluded */
  exclude?: string[];
}

export interface StateTransition {
  state: ActionState;
  at: string; // ISO datetime
  by?: string; // DID of who triggered
}

export interface ActionApproval {
  role: string;
  did?: string;
  reason: string;
  granted?: boolean;
  at?: string;
}

export interface ActionApprovals {
  required: ActionApproval[];
  policy_ref?: string;
}

export interface ActionConsent {
  receipt_id?: string;
  purposes: string[];
  revocable: boolean;
}

export interface ActionSource {
  policy_version?: string;
  helper_model?: string;
  confidence?: number;
  citations?: string[];
}

export interface ActionExpiration {
  expires_at: string;
  behavior_on_expiry: ExpiryBehavior;
}

export interface ActionReversal {
  reversible: boolean;
  reversal_window_hours?: number;
  reversal_requires?: string;
}

export interface ActionAppeal {
  route: AppealRoute;
  deadline_hours: number;
}

export interface ActionOffline {
  created_offline: boolean;
  conflict_rule: ConflictRule;
  vector_clock?: Record<string, number>;
  max_offline_hours?: number;
}

export interface ActionExplanation {
  human_readable: string;
  language: string;
}

// ---------- Main Envelope ----------

export interface MiAction<TPayload = Record<string, unknown>> {
  /** UUIDv7 for time-ordering */
  id: string;
  /** Schema version */
  version: '1.0';
  /** Action type URI (e.g. pocket.thank, voice.ballot) */
  type: string;
  /** Who is performing the action */
  actor: ActionActor;
  /** Where the action originates */
  place: ActionPlace;
  /** Which law pack applies */
  jurisdiction: ActionJurisdiction;
  /** Who can see this action */
  audience: ActionAudience;
  /** Human-readable purpose */
  purpose: string;
  /** Data classification */
  sensitivity: Sensitivity;
  /** Lifecycle state */
  state: {
    current: ActionState;
    previous: StateTransition[];
  };
  /** Required approvals */
  approvals?: ActionApprovals;
  /** Consent receipt */
  consent?: ActionConsent;
  /** Source/provenance */
  source?: ActionSource;
  /** Expiration rules */
  expiration?: ActionExpiration;
  /** Reversal rules */
  reversal?: ActionReversal;
  /** Appeal route */
  appeal?: ActionAppeal;
  /** Offline metadata */
  offline?: ActionOffline;
  /** Plain-language explanation */
  explanation: ActionExplanation;
  /** Action-specific payload */
  payload: TPayload;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at?: string;
  /** Ed25519 signature (optional for MVP) */
  signature?: string;
}

// ---------- Common Payload Types ----------

export interface PocketThankPayload {
  recipient_did: string;
  recipient_name: string;
  amount: number;
  reason: string;
  from_pot: 'spending' | 'savings' | 'community';
}

export interface VoteBallotPayload {
  proposal_id: string;
  direction: 'for' | 'against' | 'abstain';
}

export interface QuestCompletePayload {
  quest_id: string;
  evidence_description: string;
  reward_amount: number;
}

export interface SafetyReportPayload {
  category: 'dv' | 'child_safety' | 'threat' | 'harassment' | 'other';
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  description: string;
}

export interface LeaveNowPayload {
  freeze_jars: boolean;
  hide_location: boolean;
  remove_devices: boolean;
  notify_contacts: string[];
}
