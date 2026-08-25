'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// ─── Create Proposal ─────────────────────────────────────────────────────────
const createProposalSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(50).max(10000),
  category: z.enum(['general', 'treasury', 'policy', 'amendment', 'recall']),
  voting_days: z.number().int().min(3).max(30).default(14),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;

export async function createProposal(input: CreateProposalInput) {
  const parsed = createProposalSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join(', ') };
  }

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Check standing threshold (minimum standing to propose)
  const { data: standing } = await supabase
    .from('standing')
    .select('overall')
    .eq('user_id', user.id)
    .single();

  // Require minimum 5 overall standing to create proposals (prevents spam)
  if (!standing || standing.overall < 5) {
    return { error: 'Minimum standing of 5 required to create proposals. Participate more in the community first.' };
  }

  const opensAt = new Date();
  const closesAt = new Date(opensAt.getTime() + parsed.data.voting_days * 24 * 60 * 60 * 1000);

  // Quorum based on category
  const quorumMap: Record<string, number> = {
    general: 10,
    treasury: 15,
    policy: 15,
    amendment: 25,
    recall: 20,
  };

  const { data, error } = await supabase
    .from('proposals')
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category,
      status: 'active',
      quorum_required: quorumMap[parsed.data.category] || 10,
      opens_at: opensAt.toISOString(),
      closes_at: closesAt.toISOString(),
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/governance');
  return { success: true, id: data.id };
}

// ─── Cast Vote ───────────────────────────────────────────────────────────────
const castVoteSchema = z.object({
  proposal_id: z.string().uuid(),
  direction: z.enum(['for', 'against', 'abstain']),
});

export async function castVote(input: z.infer<typeof castVoteSchema>) {
  const parsed = castVoteSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid vote data' };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify proposal is active and within voting window
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, status, opens_at, closes_at')
    .eq('id', parsed.data.proposal_id)
    .single();

  if (!proposal) return { error: 'Proposal not found' };
  if (proposal.status !== 'active') return { error: 'Proposal is not active' };

  const now = new Date();
  if (proposal.opens_at && new Date(proposal.opens_at) > now) {
    return { error: 'Voting has not opened yet' };
  }
  if (proposal.closes_at && new Date(proposal.closes_at) < now) {
    return { error: 'Voting period has ended' };
  }

  // Check not already voted
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('proposal_id', parsed.data.proposal_id)
    .eq('user_id', user.id)
    .single();

  if (existingVote) return { error: 'You already voted on this proposal' };

  // Calculate vote weight (based on standing)
  const { data: standing } = await supabase
    .from('standing')
    .select('voice')
    .eq('user_id', user.id)
    .single();

  const weight = Math.max(1, Math.min(3, 1 + (standing?.voice || 0) / 50));

  // Insert vote
  const { error: voteError } = await supabase
    .from('votes')
    .insert({
      proposal_id: parsed.data.proposal_id,
      user_id: user.id,
      direction: parsed.data.direction,
      weight: Math.round(weight * 100) / 100,
    });

  if (voteError) {
    if (voteError.code === '23505') return { error: 'Already voted' };
    return { error: voteError.message };
  }

  // Update vote counts on proposal
  const voteIncrement = parsed.data.direction === 'for' ? 'votes_for' : 
                        parsed.data.direction === 'against' ? 'votes_against' : null;

  if (voteIncrement) {
    const { data: current } = await supabase
      .from('proposals')
      .select('votes_for, votes_against')
      .eq('id', parsed.data.proposal_id)
      .single();

    if (current) {
      await supabase
        .from('proposals')
        .update({
          [voteIncrement]: (current as any)[voteIncrement] + 1,
        })
        .eq('id', parsed.data.proposal_id);
    }
  }

  // Boost voice standing for voting
  if (standing) {
    await supabase
      .from('standing')
      .update({ voice: Math.min(100, (standing.voice || 0) + 0.5) })
      .eq('user_id', user.id);
  }

  revalidatePath('/governance');
  return { success: true };
}

// ─── Close Proposal (auto or manual) ─────────────────────────────────────────
export async function closeProposal(proposalId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (!proposal) return { error: 'Proposal not found' };
  if (proposal.status !== 'active') return { error: 'Already closed' };

  // Only author or admins can manually close before deadline
  if (proposal.author_id !== user.id) {
    // Check if past deadline
    if (!proposal.closes_at || new Date(proposal.closes_at) > new Date()) {
      return { error: 'Only the author can close before the deadline' };
    }
  }

  // Determine result
  const totalVotes = proposal.votes_for + proposal.votes_against;
  const quorumMet = totalVotes >= proposal.quorum_required;
  const passed = quorumMet && proposal.votes_for > proposal.votes_against;

  await supabase
    .from('proposals')
    .update({
      status: passed ? 'passed' : 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  revalidatePath('/governance');
  return { success: true, result: passed ? 'passed' : 'rejected', quorum_met: quorumMet };
}

// ─── Add Comment to Proposal ─────────────────────────────────────────────────
const addCommentSchema = z.object({
  proposal_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
  parent_comment_id: z.string().uuid().optional(),
});

export async function addProposalComment(input: z.infer<typeof addCommentSchema>) {
  const parsed = addCommentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('proposal_comments')
    .insert({
      proposal_id: parsed.data.proposal_id,
      author_id: user.id,
      body: parsed.data.body,
      parent_comment_id: parsed.data.parent_comment_id || null,
    });

  if (error) return { error: error.message };

  revalidatePath('/governance');
  return { success: true };
}

// ─── Advance Proposal Stage ──────────────────────────────────────────────────
export async function advanceProposalStage(proposalId: string, newStage: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Only author or steward can advance stage
  const { data: proposal } = await supabase
    .from('proposals')
    .select('author_id')
    .eq('id', proposalId)
    .single();

  if (!proposal) return { error: 'Proposal not found' };
  if (proposal.author_id !== user.id) return { error: 'Only the author can advance stages' };

  const { data: result, error } = await supabase.rpc('advance_proposal_stage', {
    p_proposal_id: proposalId,
    p_new_stage: newStage,
  });

  if (error) return { error: error.message };
  const rpcResult = result as any;
  if (!rpcResult?.success) return { error: rpcResult?.error || 'Stage transition failed' };

  revalidatePath('/governance');
  return { success: true };
}

// ─── Create Delegation ───────────────────────────────────────────────────────
const delegateSchema = z.object({
  delegate_id: z.string().uuid(),
  topic: z.string().min(1).max(50).default('general'),
  duration_days: z.number().int().min(1).max(180).default(90),
});

export async function createDelegation(input: z.infer<typeof delegateSchema>) {
  const parsed = delegateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (parsed.data.delegate_id === user.id) return { error: 'Cannot delegate to yourself' };

  const expiresAt = new Date(Date.now() + parsed.data.duration_days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('delegations').insert({
    delegator_id: user.id,
    delegate_id: parsed.data.delegate_id,
    topic: parsed.data.topic,
    expires_at: expiresAt,
  });

  if (error) {
    if (error.code === '23505') return { error: 'Already delegated to this person on this topic' };
    return { error: error.message };
  }

  revalidatePath('/governance');
  return { success: true };
}

// ─── Revoke Delegation ───────────────────────────────────────────────────────
export async function revokeDelegation(delegationId: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('delegations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', delegationId)
    .eq('delegator_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/governance');
  return { success: true };
}
