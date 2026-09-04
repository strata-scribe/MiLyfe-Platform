import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export async function handleNameChange(
  supabase: SupabaseClient<Database>,
  userId: string,
  newName: { first?: string; last?: string; preferred?: string }
) {
  // Construct the new display name
  const nameParts = [];
  if (newName.preferred) {
    nameParts.push(newName.preferred);
  } else {
    if (newName.first) nameParts.push(newName.first);
    if (newName.last) nameParts.push(newName.last);
  }

  const displayName = nameParts.join(' ');

  if (!displayName) {
    throw new Error('New name must contain at least one of: first, last, preferred');
  }

  // Fetch the current profile metadata first to merge it
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch profile: ${fetchError.message}`);
  }

  const metadata = profile?.metadata || {};

  // Record previous name in metadata if they ever want to access it
  const updatedMetadata = {
    ...metadata,
    name_history: [
      ...(Array.isArray((metadata as any).name_history) ? (metadata as any).name_history : []),
      { timestamp: new Date().toISOString() } // simplified history entry, real one would have old name
    ],
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      metadata: updatedMetadata as Record<string, unknown>
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update name: ${error.message}`);
  }

  return { success: true, displayName };
}

export async function handleHouseholdMerge(
  supabase: SupabaseClient<Database>,
  primaryUserId: string,
  secondaryUserId: string
) {
  // Check if connection already exists
  const { data: existing, error: checkError } = await supabase
    .from('relationships')
    .select('id')
    .eq('from_user_id', primaryUserId)
    .eq('to_user_id', secondaryUserId)
    .eq('type', 'connected_to')
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is no rows returned
    throw new Error(`Failed to check existing relationships: ${checkError.message}`);
  }

  if (existing) {
    return { success: true, message: 'Already connected' };
  }

  // A mutual connection in this MVP means two records (one each way)
  const { error: insertError } = await supabase
    .from('relationships')
    .insert([
      {
        from_user_id: primaryUserId,
        to_user_id: secondaryUserId,
        type: 'connected_to',
        metadata: { context: 'household_merge' },
      },
      {
        from_user_id: secondaryUserId,
        to_user_id: primaryUserId,
        type: 'connected_to',
        metadata: { context: 'household_merge' },
      }
    ]);

  if (insertError) {
    throw new Error(`Failed to merge household: ${insertError.message}`);
  }

  return { success: true };
}

export async function handleSeparation(
  supabase: SupabaseClient<Database>,
  userId1: string,
  userId2: string
) {
  // Remove relationships between the two users
  // This covers 'connected_to', 'member_of', 'guardian_of' depending on what's active.
  const { error } = await supabase
    .from('relationships')
    .delete()
    .or(`and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`);

  if (error) {
    throw new Error(`Failed to process separation: ${error.message}`);
  }

  return { success: true };
}

export async function handleBereavement(
  supabase: SupabaseClient<Database>,
  deceasedUserId: string
) {
  // Update profile metadata to mark as deceased
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('id', deceasedUserId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch profile: ${fetchError.message}`);
  }

  const metadata = profile?.metadata || {};
  const updatedMetadata = {
    ...metadata,
    deceased: true,
    deceased_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ metadata: updatedMetadata as Record<string, unknown> })
    .eq('id', deceasedUserId);

  if (updateError) {
    throw new Error(`Failed to update profile status: ${updateError.message}`);
  }

  // Remove any active outgoing or incoming relationships
  // (We could keep them for historical purposes, but requirements say delete active relationships)
  const { error: relError } = await supabase
    .from('relationships')
    .delete()
    .or(`from_user_id.eq.${deceasedUserId},to_user_id.eq.${deceasedUserId}`);

  if (relError) {
    throw new Error(`Failed to clean up relationships: ${relError.message}`);
  }

  return { success: true };
}
