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
  if (!calculations.length) return;

  console.log(`Upserting ${calculations.length} point calculations`);

  // Process calculations in smaller batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < calculations.length; i += batchSize) {
    const batch = calculations.slice(i, i + batchSize);
    
    const { error } = await supabaseClient
      .from('player_points_calculation')
      .upsert(batch, {
        onConflict: 'event_id,player_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error upserting batch ${i / batchSize + 1}:`, error);
      throw error;
    }
    
    console.log(`Successfully upserted batch ${i / batchSize + 1} of ${Math.ceil(calculations.length / batchSize)}`);
  }
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