import type { MiAction, Sensitivity, Visibility, AppealRoute } from './types';
import { miActionSchema } from './schema';

/**
 * Configuration for the current MiLyfe instance.
 * In production, this comes from environment/config.
 */
const INSTANCE_CONFIG = {
  instance_id: process.env.NEXT_PUBLIC_MILYFE_INSTANCE_ID || 'local-dev',
  law_pack_version: '1.0.0',
  country_code: 'US',
  subdivision: 'FL',
};

interface CreateActionOptions<TPayload> {
  type: string;
  actor: {
    did: string;
    role: string;
    is_helper?: boolean;
    device_id?: string;
  };
  payload: TPayload;
  purpose: string;
  sensitivity?: Sensitivity;
  visibility?: Visibility;
  named_recipients?: string[];
  appeal_route?: AppealRoute;
  appeal_deadline_hours?: number;
  reversible?: boolean;
  reversal_window_hours?: number;
  offline?: boolean;
}

/**
 * Create a new MiAction envelope with sensible defaults.
 * Validates against the Zod schema before returning.
 */
export function createAction<TPayload extends Record<string, unknown>>(
  options: CreateActionOptions<TPayload>,
): MiAction<TPayload> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const action: MiAction<TPayload> = {
    id,
    version: '1.0',
    type: options.type,
    actor: {
      did: options.actor.did,
      role: options.actor.role,
      is_helper: options.actor.is_helper ?? false,
      device_id: options.actor.device_id,
    },
    place: {
      instance_id: INSTANCE_CONFIG.instance_id,
    },
    jurisdiction: {
      law_pack_version: INSTANCE_CONFIG.law_pack_version,
      country_code: INSTANCE_CONFIG.country_code,
      subdivision: INSTANCE_CONFIG.subdivision,
    },
    audience: {
      visibility: options.visibility ?? 'self',
      named_recipients: options.named_recipients,
    },
    purpose: options.purpose,
    sensitivity: options.sensitivity ?? 'community',
    state: {
      current: 'draft',
      previous: [],
    },
    appeal: options.appeal_route
      ? {
          route: options.appeal_route,
          deadline_hours: options.appeal_deadline_hours ?? 72,
        }
      : {
          route: 'peer_review',
          deadline_hours: 72,
        },
    reversal: {
      reversible: options.reversible ?? false,
      reversal_window_hours: options.reversal_window_hours,
    },
    offline: options.offline
      ? {
          created_offline: true,
          conflict_rule: 'first_write_wins',
        }
      : undefined,
    explanation: {
      human_readable: options.purpose,
      language: 'en',
    },
    payload: options.payload,
    created_at: now,
  };

  // Validate
  const result = miActionSchema.safeParse(action);
  if (!result.success) {
    throw new Error(
      `MiAction validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  return action;
}

/**
 * Shorthand: Create a pocket.thank action
 */
export function createThankAction(params: {
  from_did: string;
  to_did: string;
  to_name: string;
  amount: number;
  reason: string;
}): MiAction {
  return createAction({
    type: 'pocket.thank',
    actor: { did: params.from_did, role: 'member' },
    payload: {
      recipient_did: params.to_did,
      recipient_name: params.to_name,
      amount: params.amount,
      reason: params.reason,
      from_pot: 'spending',
    },
    purpose: `Thank ${params.to_name} ${params.amount} $MLY for: ${params.reason}`,
    sensitivity: 'community',
    visibility: 'named',
    named_recipients: [params.to_did],
    reversible: true,
    reversal_window_hours: 24,
    appeal_route: 'peer_review',
  });
}

/**
 * Shorthand: Create a voice.ballot action
 */
export function createBallotAction(params: {
  voter_did: string;
  proposal_id: string;
  direction: 'for' | 'against' | 'abstain';
}): MiAction {
  return createAction({
    type: 'voice.ballot',
    actor: { did: params.voter_did, role: 'member' },
    payload: {
      proposal_id: params.proposal_id,
      direction: params.direction,
    },
    purpose: `Cast vote on proposal`,
    sensitivity: 'private',
    visibility: 'self',
    reversible: false,
    appeal_route: 'circle_panel',
  });
}

/**
 * Shorthand: Create a safety.leave_now action
 */
export function createLeaveNowAction(params: {
  member_did: string;
  notify_contacts: string[];
}): MiAction {
  return createAction({
    type: 'safety.leave_now',
    actor: { did: params.member_did, role: 'member' },
    payload: {
      freeze_jars: true,
      hide_location: true,
      remove_devices: true,
      notify_contacts: params.notify_contacts,
    },
    purpose: 'Emergency safety activation',
    sensitivity: 'safety_critical',
    visibility: 'self',
    reversible: false,
    appeal_route: 'place_mediator',
    appeal_deadline_hours: 168, // 7 days (safety actions get more time)
  });
}
