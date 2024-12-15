import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { LivePerformance, Player, ScoringRules, PointsCalculation } from './types.ts';

export async function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export async function getScoringRules(supabaseClient: any): Promise<ScoringRules> {
  const { data: rules, error } = await supabaseClient
    .from('scoring_rules')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  if (!rules) throw new Error('No scoring rules found');
  
  return rules;
}

export async function getLivePerformances(supabaseClient: any): Promise<LivePerformance[]> {
  const { data: performances, error } = await supabaseClient
    .from('gameweek_live_performance')
    .select('*')
    .eq('modified', true);

  if (error) throw error;
  return performances || [];
}

export async function getPlayers(supabaseClient: any, playerIds: number[]): Promise<Map<number, Player>> {
  const { data: players, error } = await supabaseClient
    .from('players')
    .select('id,element_type')
    .in('id', playerIds);

  if (error) throw error;
  if (!players) throw new Error('No players found');

  return new Map(players.map(p => [p.id, p]));
}

export async function upsertPointsCalculations(
  supabaseClient: any,
  calculations: PointsCalculation[]
): Promise<void> {
  const { error } = await supabaseClient
    .from('player_points_calculation')
    .upsert(calculations, {
      onConflict: 'event_id,player_id,fixture_id'
    });

  if (error) throw error;
}

export async function updatePerformanceStatus(
  supabaseClient: any,
  performanceIds: number[]
): Promise<void> {
  const { error } = await supabaseClient
    .from('gameweek_live_performance')
    .update({ modified: false })
    .in('id', performanceIds);

  if (error) throw error;
}
