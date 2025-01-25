import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { calculateMinutesPoints, calculateGoalPoints, calculateGoalsConcededPoints, calculateCardPoints } from './calculators.ts';
import { logDebug, logError } from './logging.ts';
import { calculateBonusPoints } from './calculators/bonusCalculator.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logDebug('calculate-points', 'Starting points calculation');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First get the scoring rules with detailed error logging
    const { data: rules, error: rulesError } = await supabaseClient
      .from('scoring_rules')
      .select('*')
      .limit(1)
      .single();

    if (rulesError) {
      logError('calculate-points', 'Failed to fetch scoring rules:', rulesError);
      throw new Error(`Failed to fetch scoring rules: ${rulesError.message}`);
    }

    if (!rules) {
      logError('calculate-points', 'No scoring rules found in database');
      throw new Error('No scoring rules found');
    }

    logDebug('calculate-points', 'Fetched scoring rules:', rules);

    // Get performances that need points calculated with detailed logging
    const { data: performances, error: perfError } = await supabaseClient
      .from('gameweek_live_performance')
      .select(`
        *,
        player:players!inner(
          id,
          element_type
        )
      `)
      .eq('modified', true);

    if (perfError) {
      logError('calculate-points', 'Failed to fetch performances:', perfError);
      throw new Error(`Failed to fetch performances: ${perfError.message}`);
    }

    if (!performances?.length) {
      logDebug('calculate-points', 'No performances to process');
      return new Response(
        JSON.stringify({ message: 'No performances to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logDebug('calculate-points', `Processing ${performances.length} performances`);

    // Group performances by fixture for BPS calculations with validation
    const fixturePerformances = performances.reduce((acc, perf) => {
      if (!perf.fixture_id) {
        logDebug('calculate-points', `No fixture_id for performance ${perf.id}`);
        return acc;
      }
      
      if (!acc[perf.fixture_id]) {
        acc[perf.fixture_id] = [];
      }
      acc[perf.fixture_id].push(perf);
      return acc;
    }, {} as Record<number, typeof performances>);

    const pointsCalculations = [];

    for (const perf of performances) {
      if (!perf.player?.element_type) {
        logError('calculate-points', `Missing player data for performance:`, { 
          performance_id: perf.id,
          player_id: perf.player_id
        });
        continue;
      }

      logDebug('calculate-points', `Calculating points for player ${perf.player_id}`, {
        player_type: perf.player.element_type,
        fixture_id: perf.fixture_id,
        minutes: perf.minutes,
        goals: perf.goals_scored,
        assists: perf.assists
      });

      // Ensure all values are defined with fallbacks to 0
      const minutes = perf.minutes || 0;
      const goalsScored = perf.goals_scored || 0;
      const cleanSheets = perf.clean_sheets || 0;
      const goalsConceded = perf.goals_conceded || 0;
      const assists = perf.assists || 0;
      const penaltiesSaved = perf.penalties_saved || 0;
      const penaltiesMissed = perf.penalties_missed || 0;
      const ownGoals = perf.own_goals || 0;
      const yellowCards = perf.yellow_cards || 0;
      const redCards = perf.red_cards || 0;
      const saves = perf.saves || 0;
      const elementType = perf.player.element_type;

      // Calculate points with logging
      const minutesPoints = calculateMinutesPoints(minutes, rules);
      const goalsPoints = calculateGoalPoints(goalsScored, elementType, rules);
      const cleanSheetPoints = cleanSheets ? calculateGoalsConcededPoints(0, elementType, rules) : 0;
      const goalsConcededPoints = calculateGoalsConcededPoints(goalsConceded, elementType, rules);
      const assistPoints = assists * rules.assists;
      const penaltySavePoints = penaltiesSaved * rules.penalties_saved;
      const penaltyMissPoints = penaltiesMissed * rules.penalties_missed;
      const ownGoalPoints = ownGoals * rules.own_goals;
      const cardPoints = calculateCardPoints(yellowCards, redCards, rules);
      const savePoints = Math.floor(saves / 3);

      // Calculate bonus points based on BPS with validation
      let bonusPoints = 0;
      if (perf.fixture_id && fixturePerformances[perf.fixture_id]) {
        const fixtureBPS = fixturePerformances[perf.fixture_id].map(p => ({
          player_id: p.player_id,
          bps: p.bps || 0,
          fixture_id: p.fixture_id || 0,
          minutes: p.minutes || 0
        }));
        
        const playerBPS = [{
          player_id: perf.player_id,
          bps: perf.bps || 0,
          fixture_id: perf.fixture_id,
          minutes: minutes
        }];

        bonusPoints = calculateBonusPoints(playerBPS, fixtureBPS);
      }

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

      const finalTotalPoints = rawTotalPoints + bonusPoints;

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
        savePoints,
        bonusPoints,
        rawTotalPoints,
        finalTotalPoints,
        stats: {
          minutes,
          goalsScored,
          cleanSheets,
          goalsConceded,
          assists,
          penaltiesSaved,
          penaltiesMissed,
          ownGoals,
          yellowCards,
          redCards,
          saves,
          elementType,
          bps: perf.bps
        }
      });

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
        final_total_points: finalTotalPoints,
        last_updated: new Date().toISOString()
      });
    }

    // Batch insert all calculations with error handling
    const { error: insertError } = await supabaseClient
      .from('player_points_calculation')
      .upsert(pointsCalculations, {
        onConflict: 'event_id,player_id,fixture_id'
      });

    if (insertError) {
      logError('calculate-points', 'Failed to insert calculations:', insertError);
      throw new Error(`Failed to insert calculations: ${insertError.message}`);
    }

    // Mark performances as processed
    const { error: updateError } = await supabaseClient
      .from('gameweek_live_performance')
      .update({ modified: false })
      .in('id', performances.map(p => p.id));

    if (updateError) {
      logError('calculate-points', 'Failed to update performances:', updateError);
      throw new Error(`Failed to update performances: ${updateError.message}`);
    }

    logDebug('calculate-points', 'Points calculation completed successfully');

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
    logError('calculate-points', 'Error in points calculation:', error);
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