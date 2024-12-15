import { corsHeaders } from '../_shared/cors.ts';
import {
  calculateMinutesPoints,
  calculateGoalPoints,
  calculateCleanSheetPoints,
  calculateGoalsConcededPoints,
  calculateSavePoints,
  calculateCardPoints,
  calculatePenaltyPoints
} from './calculators.ts';
import {
  getSupabaseClient,
  getScoringRules,
  getLivePerformances,
  getPlayers,
  upsertPointsCalculations,
  updatePerformanceStatus
} from './database.ts';
import { PointsCalculation } from './types.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting points calculation...');
    
    const supabaseClient = await getSupabaseClient();
    const rules = await getScoringRules(supabaseClient);
    const performances = await getLivePerformances(supabaseClient);

    console.log(`Found ${performances.length} performances to process`);

    if (!performances.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'No new performances to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playerIds = [...new Set(performances.map(p => p.player_id))];
    const playerMap = await getPlayers(supabaseClient, playerIds);

    const pointsCalculations = performances.map(perf => {
      const player = playerMap.get(perf.player_id);
      if (!player) {
        console.error(`No player found for ID ${perf.player_id}`);
        return null;
      }

      const minutesPoints = calculateMinutesPoints(perf.minutes, rules);
      const goalsPoints = calculateGoalPoints(perf.goals_scored, player.element_type, rules);
      const cleanSheetPoints = calculateCleanSheetPoints(perf.clean_sheets, player.element_type, rules);
      const goalsConcededPoints = calculateGoalsConcededPoints(perf.goals_conceded, player.element_type, rules);
      const savesPoints = calculateSavePoints(perf.saves, player.element_type, rules);
      const assistPoints = perf.assists * rules.assists;
      const penaltyPoints = calculatePenaltyPoints(perf.penalties_saved, perf.penalties_missed, rules);
      const ownGoalPoints = perf.own_goals * rules.own_goals;
      const cardPoints = calculateCardPoints(perf.yellow_cards, perf.red_cards, rules);
      const bonusPoints = perf.bonus || 0;

      const rawTotal = 
        minutesPoints +
        goalsPoints +
        cleanSheetPoints +
        goalsConcededPoints +
        savesPoints +
        assistPoints +
        penaltyPoints +
        ownGoalPoints +
        cardPoints +
        bonusPoints;

      console.log(`Calculated points for player ${perf.player_id} in fixture ${perf.fixture_id}: ${rawTotal}`);

      return {
        event_id: perf.event_id,
        player_id: perf.player_id,
        fixture_id: perf.fixture_id, // Now including fixture_id in the calculation record
        minutes_points: minutesPoints,
        goals_scored_points: goalsPoints,
        clean_sheet_points: cleanSheetPoints,
        goals_conceded_points: goalsConcededPoints,
        saves_points: savesPoints,
        assist_points: assistPoints,
        penalty_save_points: perf.penalties_saved * rules.penalties_saved,
        penalty_miss_points: perf.penalties_missed * rules.penalties_missed,
        own_goal_points: ownGoalPoints,
        card_points: cardPoints,
        bonus_points: bonusPoints,
        raw_total_points: rawTotal,
        final_total_points: rawTotal, // No multipliers yet
      };
    }).filter(Boolean) as PointsCalculation[];

    await upsertPointsCalculations(supabaseClient, pointsCalculations);
    await updatePerformanceStatus(supabaseClient, performances.map(p => p.id));

    console.log(`Successfully processed ${pointsCalculations.length} calculations`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${pointsCalculations.length} calculations`,
        processed: pointsCalculations.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});