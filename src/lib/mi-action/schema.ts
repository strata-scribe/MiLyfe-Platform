import { z } from 'zod';

// ---------- Enum Schemas ----------

export const actionStateSchema = z.enum([
  'draft',
  'pending_approval',
  'walking',
  'sent',
  'arrived',
  'executed',
  'failed',
  'expired',
  'reversed',
  'appealed',
]);

export const visibilitySchema = z.enum([
  'self',
  'named',
  'household',
  'circle',
  'place',
  'federation',
  'public',
]);

export const sensitivitySchema = z.enum([
  'public',
  'community',
  'private',
  'intimate',
  'safety_critical',
]);

export const geoScopeSchema = z.enum([
  'block',
  'neighborhood',
  'city',
  'region',
  'global',
]);

export const conflictRuleSchema = z.enum([
  'last_write_wins',
  'first_write_wins',
  'merge',
  'human_review',
  'reject_later',
  'reservation',
]);

export const expiryBehaviorSchema = z.enum([
  'void',
  'archive',
  'escalate',
  'auto_approve',
]);

export const appealRouteSchema = z.enum([
  'peer_review',
  'circle_panel',
  'place_mediator',
  'federation_ombuds',
  'fork',
]);

// ---------- Sub-schemas ----------

export const actorSchema = z.object({
  did: z.string().min(1),
  role: z.string().min(1),
  device_id: z.string().optional(),
  is_helper: z.boolean().default(false),
});

export const placeSchema = z.object({
  instance_id: z.string().min(1),
  geo_scope: geoScopeSchema.optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      accuracy_m: z.number().positive().optional(),
    })
    .optional(),
});

export const jurisdictionSchema = z.object({
  law_pack_version: z.string().min(1),
  country_code: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  subdivision: z.string().optional(),
  overrides: z.array(z.string()).optional(),
});

export const audienceSchema = z.object({
  visibility: visibilitySchema,
  named_recipients: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

export const stateTransitionSchema = z.object({
  state: actionStateSchema,
  at: z.string().datetime(),
  by: z.string().optional(),
});

export const approvalSchema = z.object({
  role: z.string(),
  did: z.string().optional(),
  reason: z.string(),
  granted: z.boolean().optional(),
  at: z.string().datetime().optional(),
});

export const approvalsSchema = z.object({
  required: z.array(approvalSchema),
  policy_ref: z.string().optional(),
});

export const consentSchema = z.object({
  receipt_id: z.string().uuid().optional(),
  purposes: z.array(z.string()),
  revocable: z.boolean().default(true),
});

export const sourceSchema = z.object({
  policy_version: z.string().optional(),
  helper_model: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  citations: z.array(z.string()).optional(),
});

export const expirationSchema = z.object({
  expires_at: z.string().datetime(),
  behavior_on_expiry: expiryBehaviorSchema,
});

export const reversalSchema = z.object({
  reversible: z.boolean().default(false),
  reversal_window_hours: z.number().positive().optional(),
  reversal_requires: z.string().optional(),
});

export const appealSchema = z.object({
  route: appealRouteSchema,
  deadline_hours: z.number().positive(),
});

export const offlineSchema = z.object({
  created_offline: z.boolean().default(false),
  conflict_rule: conflictRuleSchema,
  vector_clock: z.record(z.string(), z.number().int()).optional(),
  max_offline_hours: z.number().positive().optional(),
});

export const explanationSchema = z.object({
  human_readable: z.string().min(1),
  language: z.string().min(2).max(5).default('en'),
});

// ---------- Main MiAction Schema ----------

export const miActionSchema = z.object({
  id: z.string().uuid(),
  version: z.literal('1.0'),
  type: z
    .string()
    .regex(
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
      'Action type must be dot-separated lowercase segments (e.g. pocket.thank)',
    ),
  actor: actorSchema,
  place: placeSchema,
  jurisdiction: jurisdictionSchema,
  audience: audienceSchema,
  purpose: z.string().min(1).max(500),
  sensitivity: sensitivitySchema,
  state: z.object({
    current: actionStateSchema,
    previous: z.array(stateTransitionSchema).default([]),
  }),
  approvals: approvalsSchema.optional(),
  consent: consentSchema.optional(),
  source: sourceSchema.optional(),
  expiration: expirationSchema.optional(),
  reversal: reversalSchema.optional(),
  appeal: appealSchema.optional(),
  offline: offlineSchema.optional(),
  explanation: explanationSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  signature: z.string().optional(),
});

// ---------- Payload Schemas for Common Actions ----------

export const pocketThankPayloadSchema = z.object({
  recipient_did: z.string().min(1),
  recipient_name: z.string().min(1),
  amount: z.number().positive().max(10000),
  reason: z.string().min(1).max(200),
  from_pot: z.enum(['spending', 'savings', 'community']),
});

export const voteBallotPayloadSchema = z.object({
  proposal_id: z.string().uuid(),
  direction: z.enum(['for', 'against', 'abstain']),
});

export const questCompletePayloadSchema = z.object({
  quest_id: z.string().uuid(),
  evidence_description: z.string().min(1).max(1000),
  reward_amount: z.number().positive(),
});

export const safetyReportPayloadSchema = z.object({
  category: z.enum(['dv', 'child_safety', 'threat', 'harassment', 'other']),
  urgency: z.enum(['routine', 'soon', 'urgent', 'emergency']),
  description: z.string().min(1).max(2000),
});

export const leaveNowPayloadSchema = z.object({
  freeze_jars: z.boolean(),
  hide_location: z.boolean(),
  remove_devices: z.boolean(),
  notify_contacts: z.array(z.string()),
});

// ---------- Type Exports ----------

export type MiActionInput = z.infer<typeof miActionSchema>;
export type PocketThankInput = z.infer<typeof pocketThankPayloadSchema>;
export type VoteBallotInput = z.infer<typeof voteBallotPayloadSchema>;
