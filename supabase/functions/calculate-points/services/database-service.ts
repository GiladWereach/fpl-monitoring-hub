import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';

export async function getScoringRules(supabaseClient: ReturnType<typeof createClient>) {
  const { data: rules, error } = await supabaseClient
    .from('scoring_rules')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    logError('database-service', 'Failed to fetch scoring rules:', error);
    throw error;
  }

  if (!rules) {
    logError('database-service', 'No scoring rules found in database');
    throw new Error('No scoring rules found');
  }

  logDebug('database-service', 'Fetched scoring rules:', rules);
  return rules;
}

export async function getPerformances(supabaseClient: ReturnType<typeof createClient>) {
  const { data: performances, error } = await supabaseClient
    .from('gameweek_live_performance')
    .select(`
      *,
      player:players!inner(
        id,
        element_type
      )
    `)
    .eq('modified', true);

  if (error) {
    logError('database-service', 'Failed to fetch performances:', error);
    throw error;
  }

  logDebug('database-service', `Fetched ${performances?.length || 0} performances`);
  return performances || [];
}

export async function upsertPointsCalculations(
  supabaseClient: ReturnType<typeof createClient>,
  calculations: any[]
) {
  if (!calculations.length) {
    logDebug('database-service', 'No calculations to upsert');
    return;
  }

  const { error } = await supabaseClient
    .from('player_points_calculation')
    .upsert(calculations, {
      onConflict: 'event_id,player_id,fixture_id'
    });

  if (error) {
    logError('database-service', 'Failed to upsert calculations:', error);
    throw error;
  }

  logDebug('database-service', `Successfully upserted ${calculations.length} calculations`);
}

export async function updatePerformanceStatus(
  supabaseClient: ReturnType<typeof createClient>,
  performanceIds: number[]
) {
  const { error } = await supabaseClient
    .from('gameweek_live_performance')
    .update({ modified: false })
    .in('id', performanceIds);

  if (error) {
    logError('database-service', 'Failed to update performance status:', error);
    throw error;
  }

  logDebug('database-service', `Updated status for ${performanceIds.length} performances`);
}