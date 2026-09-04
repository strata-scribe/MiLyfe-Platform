import { z } from 'zod';

// ---------- Schemas ----------

export const actorSchema = z.object({
  did: z.string(),
  role: z.string(),
  device_id: z.string().optional(),
  is_helper: z.boolean().default(false),
});

export const intentSchema = z.object({
  action_type: z.string(),
  purpose: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export const scopeSchema = z.object({
  geo_scope: z.enum(['block', 'neighborhood', 'city', 'region', 'global']).optional(),
  jurisdiction: z.string().optional(),
  visibility: z.enum(['self', 'named', 'household', 'circle', 'place', 'federation', 'public']),
});

export const receiptSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  status: z.enum(['pending', 'completed', 'failed', 'appealed', 'reversed']),
  signature: z.string().optional(),
});

export const appealPathSchema = z.object({
  route: z.enum(['peer_review', 'circle_panel', 'place_mediator', 'federation_ombuds', 'fork']),
  deadline_hours: z.number().positive(),
});

export const offlineSyncSchema = z.object({
  created_offline: z.boolean().default(false),
  conflict_rule: z.enum(['last_write_wins', 'first_write_wins', 'merge', 'human_review', 'reject_later', 'reservation']),
  vector_clock: z.record(z.string(), z.number().int()).optional(),
  max_offline_hours: z.number().positive().optional(),
});

export const miActionSchema = z.object({
  id: z.string().uuid(),
  version: z.literal('1.0'),
  actor: actorSchema,
  intent: intentSchema,
  scope: scopeSchema,
  receipt: receiptSchema.optional(),
  appealPath: appealPathSchema.optional(),
  offlineSync: offlineSyncSchema.optional(),
});

// ---------- Types ----------

export type Actor = z.infer<typeof actorSchema>;
export type Intent = z.infer<typeof intentSchema>;
export type Scope = z.infer<typeof scopeSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
export type AppealPath = z.infer<typeof appealPathSchema>;
export type OfflineSync = z.infer<typeof offlineSyncSchema>;
export type MiAction = z.infer<typeof miActionSchema>;

// ---------- Serialization ----------

export function serializeMiAction(action: MiAction): string {
  const validated = miActionSchema.parse(action);
  return JSON.stringify(validated);
}

export function deserializeMiAction(data: string): MiAction {
  const parsed = JSON.parse(data);
  return miActionSchema.parse(parsed);
}
