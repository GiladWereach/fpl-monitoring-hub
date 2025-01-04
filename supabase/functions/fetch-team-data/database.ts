import { createClient } from '@supabase/supabase-js';
import { TeamInfo, PlayerSelection, MatchdayStats } from './types';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeTeamData(
  teamId: number,
  currentEvent: number,
  picks: PlayerSelection[],
  stats: MatchdayStats,
  formation: string
) {
  console.log('Storing team data:', { teamId, currentEvent });

  // Store team info
  const { error: teamError } = await supabase
    .from('fpl_teams')
    .upsert({
      fpl_team_id: teamId,
      event: currentEvent,
      last_fetch: new Date().toISOString()
    }, {
      onConflict: 'fpl_team_id,event'
    });

  if (teamError) {
    console.error('Error storing team info:', teamError);
    throw teamError;
  }

  // Store team selection
  const { error: selectionError } = await supabase
    .from('team_selections')
    .upsert({
      fpl_team_id: teamId,
      event: currentEvent,
      formation: formation,
      captain_id: picks.find(p => p.is_captain)?.element,
      vice_captain_id: picks.find(p => p.is_vice_captain)?.element,
      picks: picks,
      auto_subs: []
    }, {
      onConflict: 'fpl_team_id,event'
    });

  if (selectionError) {
    console.error('Error storing team selection:', selectionError);
    throw selectionError;
  }

  // Store team performance
  const { error: performanceError } = await supabase
    .from('team_performances')
    .upsert({
      fpl_team_id: teamId,
      event: currentEvent,
      points: stats.points,
      total_points: stats.total_points,
      current_rank: stats.current_rank,
      overall_rank: stats.overall_rank,
      team_value: stats.team_value,
      bank: stats.bank
    }, {
      onConflict: 'fpl_team_id,event'
    });

  if (performanceError) {
    console.error('Error storing team performance:', performanceError);
    throw performanceError;
  }

  console.log('Successfully stored all team data');
}