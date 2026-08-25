import { createServiceSupabase } from '@/lib/supabase/server';

/**
 * Audit Trail Logger
 *
 * Records sensitive actions to the audit_log table.
 * This is a fire-and-forget operation — audit logging should never
 * block the main operation.
 *
 * Usage:
 *   await logAudit(userId, 'wallet.transfer', 'wallet', walletId, { amount: 100, to: recipientId });
 */

export type AuditAction =
  | 'wallet.transfer'
  | 'wallet.freeze'
  | 'wallet.unfreeze'
  | 'proposal.create'
  | 'proposal.close'
  | 'proposal.pass'
  | 'proposal.reject'
  | 'standing.attestation'
  | 'standing.decay'
  | 'moderation.report'
  | 'moderation.resolve'
  | 'moderation.suspend'
  | 'session.signout_others'
  | 'session.signout_all'
  | 'session.password_change'
  | 'profile.update'
  | 'safety.leave_now'
  | 'safety.deactivate'
  | 'ubi.distribute';

export async function logAudit(
  actorId: string | null,
  action: AuditAction | string,
  resourceType: string,
  resourceId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceSupabase();
    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      metadata: metadata || {},
    });
  } catch {
    // Audit logging is non-blocking — silently fail
    console.error('[audit] Failed to log:', action, resourceType);
  }
}
