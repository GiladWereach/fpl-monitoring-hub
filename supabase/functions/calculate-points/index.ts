import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  calculateMinutesPoints,
  calculateGoalPoints,
  calculateCleanSheetPoints,
  calculateGoalsConcededPoints,
  calculateBonusPoints,
  calculateCardPoints
} from './calculators/index.ts';
import { logDebug, logError } from './logging.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting points calculation...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get performances that need points calculated
    const { data: performances, error: perfError } = await supabaseClient
      .from('gameweek_live_performance')
      .select(`
        *,
        player:players (
          element_type
        )
      `)
      .eq('modified', true);

    if (perfError) throw perfError;

    logDebug('calculate-points', `Processing ${performances?.length || 0} performances`);

    const pointsCalculations = performances?.map(perf => {
      // Only calculate bonus points if player has played minutes
      const bonusPoints = perf.minutes > 0 ? calculateBonusPoints(
        [{
          player_id: perf.player_id,
          bps: perf.bps,
          fixture_id: perf.fixture_id
        }],
        performances
          .filter(p => p.fixture_id === perf.fixture_id)
          .map(p => ({
            player_id: p.player_id,
            bps: p.bps,
            fixture_id: p.fixture_id
          }))
      ) : 0;

      // Calculate minutes points - this is the key change
      const minutesPoints = calculateMinutesPoints(perf.minutes, rules);
      
      const goalsPoints = calculateGoalPoints(perf.goals_scored, perf.player.element_type, rules);
      const cleanSheetPoints = calculateCleanSheetPoints(perf.clean_sheets, perf.player.element_type, rules);
      const goalsConcededPoints = calculateGoalsConcededPoints(perf.goals_conceded, perf.player.element_type, rules);
      const assistPoints = perf.assists * rules.assists;
      const penaltySavePoints = perf.penalties_saved * rules.penalties_saved;
      const penaltyMissPoints = perf.penalties_missed * rules.penalties.missed;
      const ownGoalPoints = perf.own_goals * rules.own_goals;
      const cardPoints = calculateCardPoints(perf.yellow_cards, perf.red_cards, rules);

      const rawTotal = 
        minutesPoints +
        goalsPoints +
        cleanSheetPoints +
        goalsConcededPoints +
        assistPoints +
        penaltySavePoints +
        penaltyMissPoints +
        ownGoalPoints +
        cardPoints;

      // Add bonus points to final total only if player has played
      const finalTotal = rawTotal + bonusPoints;

      logDebug('calculate-points', `Points breakdown for player ${perf.player_id}:`, {
        minutesPoints,
        goalsPoints,
        cleanSheetPoints,
        goalsConcededPoints,
        assistPoints,
        penaltySavePoints,
        penaltyMissPoints,
        ownGoalPoints,
        cardPoints,
        bonusPoints,
        rawTotal,
        finalTotal
      });

      return {
        event_id: perf.event_id,
        player_id: perf.player_id,
        fixture_id: perf.fixture_id,
        minutes_points: minutesPoints,  // Make sure this is included
        goals_scored_points: goalsPoints,
        clean_sheet_points: cleanSheetPoints,
        goals_conceded_points: goalsConcededPoints,
        assist_points: assistPoints,
        penalty_save_points: penaltySavePoints,
        penalty_miss_points: penaltyMissPoints,
        own_goal_points: ownGoalPoints,
        card_points: cardPoints,
        bonus_points: bonusPoints,
        raw_total_points: rawTotal,
        final_total_points: finalTotal
      };
    });

    if (pointsCalculations?.length) {
      const { error: upsertError } = await supabaseClient
        .from('player_points_calculation')
        .upsert(pointsCalculations, {
          onConflict: 'event_id,player_id'
        });

      if (upsertError) throw upsertError;

      // Update modified flag
      const { error: updateError } = await supabaseClient
        .from('gameweek_live_performance')
        .update({ modified: false })
        .in('id', performances.map(p => p.id));

      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${pointsCalculations?.length || 0} calculations`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    logError('calculate-points', 'Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
