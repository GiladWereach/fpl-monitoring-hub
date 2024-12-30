import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PlayerDetails, ProcessedFixture, ProcessedHistory } from './types.ts';

export async function processPlayerData(
  supabaseClient: ReturnType<typeof createClient>,
  playerId: number,
  data: PlayerDetails
): Promise<void> {
  console.log('Processing data for player:', playerId);
  
  if (data.fixtures?.length) {
    const processedFixtures: ProcessedFixture[] = data.fixtures.map(f => ({
      player_id: playerId,
      fixture_id: f.id,
      event: f.event,
      is_home: f.is_home,
      difficulty: f.difficulty,
      last_updated: new Date().toISOString()
    }));

    console.log(`Upserting ${processedFixtures.length} fixtures for player ${playerId}`);
    const { error: fixturesError } = await supabaseClient
      .from('player_fixtures')
      .upsert(processedFixtures);

    if (fixturesError) {
      console.error('Error upserting fixtures:', fixturesError);
      throw fixturesError;
    }
  }

  if (data.history?.length) {
    const processedHistory: ProcessedHistory[] = data.history.map(h => ({
      player_id: playerId,
      fixture_id: h.fixture,
      opponent_team: h.opponent_team,
      round: h.round,
      kickoff_time: h.kickoff_time,
      was_home: h.was_home,
      team_h_score: h.team_h_score,
      team_a_score: h.team_a_score,
      total_points: h.total_points,
      minutes: h.minutes,
      goals_scored: h.goals_scored,
      assists: h.assists,
      clean_sheets: h.clean_sheets,
      goals_conceded: h.goals_conceded,
      own_goals: h.own_goals,
      penalties_saved: h.penalties_saved,
      penalties_missed: h.penalties_missed,
      yellow_cards: h.yellow_cards,
      red_cards: h.red_cards,
      saves: h.saves,
      bonus: h.bonus,
      bps: h.bps,
      influence: h.influence,
      creativity: h.creativity,
      threat: h.threat,
      ict_index: h.ict_index,
      starts: h.starts,
      expected_goals: h.expected_goals,
      expected_assists: h.expected_assists,
      expected_goal_involvements: h.expected_goal_involvements,
      expected_goals_conceded: h.expected_goals_conceded,
      value: h.value,
      transfers_balance: h.transfers_balance,
      selected: h.selected,
      transfers_in: h.transfers_in,
      transfers_out: h.transfers_out,
      last_updated: new Date().toISOString()
    }));

    console.log(`Upserting ${processedHistory.length} history records for player ${playerId}`);
    const { error: historyError } = await supabaseClient
      .from('player_history')
      .upsert(processedHistory);

    if (historyError) {
      console.error('Error upserting history:', historyError);
      throw historyError;
    }
  }

  if (data.history_past?.length) {
    console.log(`Processing ${data.history_past.length} past history records for player ${playerId}`);
    const { error: historyPastError } = await supabaseClient
      .from('player_history_past')
      .upsert(
        data.history_past.map(h => ({
          player_id: playerId,
          season_name: h.season_name,
          element_code: h.element_code,
          start_cost: h.start_cost,
          end_cost: h.end_cost,
          total_points: h.total_points,
          minutes: h.minutes,
          goals_scored: h.goals_scored,
          assists: h.assists,
          clean_sheets: h.clean_sheets,
          goals_conceded: h.goals_conceded,
          own_goals: h.own_goals,
          penalties_saved: h.penalties_saved,
          penalties_missed: h.penalties_missed,
          yellow_cards: h.yellow_cards,
          red_cards: h.red_cards,
          saves: h.saves,
          bonus: h.bonus,
          bps: h.bps,
          influence: h.influence,
          creativity: h.creativity,
          threat: h.threat,
          ict_index: h.ict_index,
          starts: h.starts,
          expected_goals: h.expected_goals,
          expected_assists: h.expected_assists,
          expected_goal_involvements: h.expected_goal_involvements,
          expected_goals_conceded: h.expected_goals_conceded,
          last_updated: new Date().toISOString()
        }))
      );

    if (historyPastError) {
      console.error('Error upserting past history:', historyPastError);
      throw historyPastError;
    }
  }
  
  console.log(`Completed processing data for player ${playerId}`);
}