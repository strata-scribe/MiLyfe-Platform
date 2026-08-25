/**
 * MiReceipt — Human-readable proof of every consequential action.
 *
 * MVP: JSON receipts stored in DB (schema compatible with W3C VC).
 * Future: sign with Ed25519, full W3C Verifiable Credential format.
 *
 * A receipt answers:
 * - What happened?
 * - What did NOT happen?
 * - Who can see it?
 * - Which policy applied?
 * - Can it be undone?
 * - When does it expire?
 * - How do I appeal?
 */

export interface MiReceipt {
  id: string;
  action_id: string;
  action_type: string;
  recipient_did: string;
  /** Multi-language summary */
  summary: {
    en: string;
    es?: string;
  };
  /** What happened */
  what_happened: string;
  /** What did NOT happen (privacy transparency) */
  what_did_not_happen: string;
  /** Who can see this action and its result */
  who_can_see: string;
  /** Which MiLegal policy was applied */
  policy_applied: string;
  /** Can this action be undone? */
  reversible: boolean;
  /** How long until reversal window closes */
  reversal_window: string | null;
  /** When does this receipt/action expire */
  expires: string;
  /** How to challenge this action */
  appeal_route: string;
  /** ISO timestamp */
  created_at: string;
}

/**
 * Generate a receipt for a completed action.
 */
export function generateReceipt(params: {
  action_id: string;
  action_type: string;
  recipient_did: string;
  actor_name: string;
  recipient_name: string;
  amount?: number;
  reason?: string;
  visibility: string;
  policy_version: string;
  reversible: boolean;
  reversal_hours?: number;
  appeal_route: string;
}): MiReceipt {
  const {
    action_id,
    action_type,
    recipient_did,
    actor_name,
    recipient_name,
    amount,
    reason,
    visibility,
    policy_version,
    reversible,
    reversal_hours,
    appeal_route,
  } = params;

  // Generate human-readable summaries based on action type
  const summaries = generateSummaries(action_type, {
    actor_name,
    recipient_name,
    amount,
    reason,
  });

  return {
    id: crypto.randomUUID(),
    action_id,
    action_type,
    recipient_did,
    summary: summaries,
    what_happened: generateWhatHappened(action_type, { actor_name, recipient_name, amount, reason }),
    what_did_not_happen: generateWhatDidNotHappen(action_type, visibility),
    who_can_see: formatVisibility(visibility, recipient_name),
    policy_applied: `milyfe-legal:${policy_version}:${action_type.replace('.', '-')}`,
    reversible,
    reversal_window: reversible && reversal_hours ? `${reversal_hours} hours` : null,
    expires: action_type === 'pocket.thank' ? 'Never (ledger entry is permanent)' : '1 year',
    appeal_route: `${appeal_route}`,
    created_at: new Date().toISOString(),
  };
}

function generateSummaries(
  type: string,
  ctx: { actor_name: string; recipient_name: string; amount?: number; reason?: string },
) {
  switch (type) {
    case 'pocket.thank':
      return {
        en: `${ctx.actor_name} thanked ${ctx.recipient_name} ${ctx.amount} $MLY${ctx.reason ? ` for ${ctx.reason}` : ''}.`,
        es: `${ctx.actor_name} agradeció a ${ctx.recipient_name} ${ctx.amount} $MLY${ctx.reason ? ` por ${ctx.reason}` : ''}.`,
      };
    case 'voice.ballot':
      return {
        en: `You voted on a proposal.`,
        es: `Votaste en una propuesta.`,
      };
    case 'quest.complete':
      return {
        en: `${ctx.actor_name} completed a quest and earned ${ctx.amount} $MLY.`,
        es: `${ctx.actor_name} completó una misión y ganó ${ctx.amount} $MLY.`,
      };
    case 'learn.badge':
      return {
        en: `${ctx.actor_name} earned a learning badge: ${ctx.reason}.`,
        es: `${ctx.actor_name} obtuvo una insignia de aprendizaje: ${ctx.reason}.`,
      };
    default:
      return {
        en: `Action completed: ${type}`,
      };
  }
}

function generateWhatHappened(
  type: string,
  ctx: { actor_name: string; recipient_name: string; amount?: number; reason?: string },
): string {
  switch (type) {
    case 'pocket.thank':
      return `${ctx.amount} $MLY transferred from ${ctx.actor_name}'s Weekly pot to ${ctx.recipient_name}`;
    case 'voice.ballot':
      return `Ballot recorded and counted (your specific choice is secret)`;
    case 'quest.complete':
      return `Quest verified and ${ctx.amount} $MLY credited to ${ctx.actor_name}`;
    default:
      return `Action ${type} executed successfully`;
  }
}

function generateWhatDidNotHappen(type: string, visibility: string): string {
  switch (type) {
    case 'pocket.thank':
      return 'No data shared beyond recipient name and amount';
    case 'voice.ballot':
      return 'Your vote choice was NOT recorded or shared with anyone (ZK ballot)';
    default:
      return `No data shared beyond ${visibility} visibility scope`;
  }
}

function formatVisibility(visibility: string, recipientName: string): string {
  switch (visibility) {
    case 'self':
      return 'Only you';
    case 'named':
      return `You and ${recipientName} only`;
    case 'household':
      return 'Your household members';
    case 'circle':
      return 'Your circle members';
    case 'place':
      return 'All community members';
    case 'public':
      return 'Public (anyone)';
    default:
      return visibility;
  }
}
