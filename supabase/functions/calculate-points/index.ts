import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { calculateMinutesPoints, calculateGoalPoints, calculateGoalsConcededPoints, calculateCardPoints } from './calculators.ts';
import { logDebug, logError } from './logging.ts';
import type { LivePerformance, Player, ScoringRules, PointsCalculation } from './types.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logDebug('Starting points calculation');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First get the scoring rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('scoring_rules')
      .select('*')
      .limit(1)
      .single();

    if (rulesError) {
      throw new Error(`Failed to fetch scoring rules: ${rulesError.message}`);
    }

    if (!rules) {
      throw new Error('No scoring rules found');
    }

    logDebug('Fetched scoring rules');

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

    if (perfError) {
      throw new Error(`Failed to fetch performances: ${perfError.message}`);
    }

    if (!performances?.length) {
      logDebug('No performances to process');
      return new Response(
        JSON.stringify({ message: 'No performances to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logDebug(`Processing ${performances.length} performances`);

    const pointsCalculations: PointsCalculation[] = [];

    for (const perf of performances) {
      // Calculate bonus points if available
      const bonusPoints = perf.bps ? Math.max(
        0,
        ...performances
          .filter(p => p.fixture_id === perf.fixture_id)
          .map(p => ({
            player_id: p.player_id,
            bps: p.bps,
            fixture_id: p.fixture_id,
            minutes: p.minutes
          }))
      ) : 0;

      // Calculate minutes points
      const minutesPoints = calculateMinutesPoints(perf.minutes, rules);
      
      const goalsPoints = calculateGoalPoints(perf.goals_scored, perf.player.element_type, rules);
      const cleanSheetPoints = perf.clean_sheets ? calculateGoalsConcededPoints(0, perf.player.element_type, rules) : 0;
      const goalsConcededPoints = calculateGoalsConcededPoints(perf.goals_conceded, perf.player.element_type, rules);
      const assistPoints = perf.assists * rules.assists;
      const penaltySavePoints = perf.penalties_saved * rules.penalties_saved;
      const penaltyMissPoints = perf.penalties_missed * rules.penalties_missed;
      const ownGoalPoints = perf.own_goals * rules.own_goals;
      const cardPoints = calculateCardPoints(perf.yellow_cards, perf.red_cards, rules);

      // Calculate save points (3 saves = 1 point)
      const savePoints = Math.floor(perf.saves / 3);

      // Sum up all points
      const rawTotalPoints = 
        minutesPoints +
        goalsPoints +
        cleanSheetPoints +
        goalsConcededPoints +
        assistPoints +
        penaltySavePoints +
        penaltyMissPoints +
        ownGoalPoints +
        cardPoints +
        savePoints;

      // Add bonus points for final total
      const finalTotalPoints = rawTotalPoints + bonusPoints;

      logDebug(`Calculated points for player ${perf.player_id}: ${finalTotalPoints}`);

      pointsCalculations.push({
        event_id: perf.event_id,
        player_id: perf.player_id,
        fixture_id: perf.fixture_id,
        minutes_points: minutesPoints,
        goals_scored_points: goalsPoints,
        clean_sheet_points: cleanSheetPoints,
        goals_conceded_points: goalsConcededPoints,
        saves_points: savePoints,
        assist_points: assistPoints,
        penalty_save_points: penaltySavePoints,
        penalty_miss_points: penaltyMissPoints,
        own_goal_points: ownGoalPoints,
        card_points: cardPoints,
        bonus_points: bonusPoints,
        raw_total_points: rawTotalPoints,
        final_total_points: finalTotalPoints
      });
    }

    // Batch insert all calculations
    const { error: insertError } = await supabaseClient
      .from('player_points_calculation')
      .upsert(pointsCalculations, {
        onConflict: 'event_id,player_id'
      });

    if (insertError) {
      throw new Error(`Failed to insert calculations: ${insertError.message}`);
    }

    // Mark performances as processed
    const { error: updateError } = await supabaseClient
      .from('gameweek_live_performance')
      .update({ modified: false })
      .in('id', performances.map(p => p.id));

    if (updateError) {
      throw new Error(`Failed to update performances: ${updateError.message}`);
    }

    logDebug('Points calculation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: performances.length,
        calculations: pointsCalculations.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    logError('Error in points calculation:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});