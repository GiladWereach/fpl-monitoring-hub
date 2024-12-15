import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LivePerformance {
  event_id: number;
  player_id: number;
  fixture_id: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
}

interface Player {
  id: number;
  element_type: number;
}

interface ScoringRules {
  long_play: number;
  short_play: number;
  goals_scored_gkp: number;
  goals_scored_def: number;
  goals_scored_mid: number;
  goals_scored_fwd: number;
  clean_sheets_gkp: number;
  clean_sheets_def: number;
  clean_sheets_mid: number;
  goals_conceded_def: number;
  goals_conceded_gkp: number;
  assists: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  saves: number;
}

function calculateMinutesPoints(minutes: number, rules: ScoringRules): number {
  if (minutes === 0) return 0;
  return minutes >= 60 ? rules.long_play : rules.short_play;
}

function calculateGoalPoints(goals: number, position: number, rules: ScoringRules): number {
  if (goals === 0) return 0;
  
  switch (position) {
    case 1: return goals * rules.goals_scored_gkp;
    case 2: return goals * rules.goals_scored_def;
    case 3: return goals * rules.goals_scored_mid;
    case 4: return goals * rules.goals_scored_fwd;
    default: return 0;
  }
}

function calculateCleanSheetPoints(cleanSheets: number, position: number, rules: ScoringRules): number {
  if (cleanSheets === 0) return 0;
  
  switch (position) {
    case 1: return rules.clean_sheets_gkp;
    case 2: return rules.clean_sheets_def;
    case 3: return rules.clean_sheets_mid;
    default: return 0;
  }
}

function calculateGoalsConcededPoints(goalsConceded: number, position: number, rules: ScoringRules): number {
  if (goalsConceded === 0 || (position !== 1 && position !== 2)) return 0;
  
  const points = Math.floor(goalsConceded / 2) * -1;
  return position === 1 ? points * rules.goals_conceded_gkp : points * rules.goals_conceded_def;
}

function calculateSavePoints(saves: number, position: number, rules: ScoringRules): number {
  if (position !== 1) return 0;
  return Math.floor(saves / 3) * rules.saves;
}

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

    // Fetch scoring rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('scoring_rules')
      .select('*')
      .limit(1)
      .single();

    if (rulesError) throw rulesError;
    if (!rules) throw new Error('No scoring rules found');

    // Fetch live performance data
    const { data: performances, error: perfError } = await supabaseClient
      .from('gameweek_live_performance')
      .select('*')
      .eq('modified', true);

    if (perfError) throw perfError;
    console.log(`Found ${performances?.length || 0} performances to process`);

    if (!performances || performances.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No new performances to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch player positions
    const playerIds = [...new Set(performances.map(p => p.player_id))];
    const { data: players, error: playersError } = await supabaseClient
      .from('players')
      .select('id,element_type')
      .in('id', playerIds);

    if (playersError) throw playersError;
    if (!players) throw new Error('No players found');

    const playerMap = new Map(players.map(p => [p.id, p]));

    // Calculate points for each performance
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
      
      // Standard action points
      const assistPoints = perf.assists * rules.assists;
      const penaltySavePoints = perf.penalties_saved * rules.penalties_saved;
      const penaltyMissPoints = perf.penalties_missed * rules.penalties_missed;
      const ownGoalPoints = perf.own_goals * rules.own_goals;
      const cardPoints = perf.red_cards ? rules.red_cards : (perf.yellow_cards * rules.yellow_cards);
      const bonusPoints = perf.bonus || 0;

      const rawTotal = 
        minutesPoints +
        goalsPoints +
        cleanSheetPoints +
        goalsConcededPoints +
        savesPoints +
        assistPoints +
        penaltySavePoints +
        penaltyMissPoints +
        ownGoalPoints +
        cardPoints +
        bonusPoints;

      return {
        event_id: perf.event_id,
        player_id: perf.player_id,
        fixture_id: perf.fixture_id,
        minutes_points: minutesPoints,
        goals_scored_points: goalsPoints,
        clean_sheet_points: cleanSheetPoints,
        goals_conceded_points: goalsConcededPoints,
        saves_points: savesPoints,
        assist_points: assistPoints,
        penalty_save_points: penaltySavePoints,
        penalty_miss_points: penaltyMissPoints,
        own_goal_points: ownGoalPoints,
        card_points: cardPoints,
        bonus_points: bonusPoints,
        raw_total_points: rawTotal,
        final_total_points: rawTotal, // No multipliers yet
      };
    }).filter(Boolean);

    // Batch upsert the calculations
    const { error: upsertError } = await supabaseClient
      .from('player_points_calculation')
      .upsert(pointsCalculations, {
        onConflict: 'event_id,player_id,fixture_id'
      });

    if (upsertError) throw upsertError;

    // Mark processed performances
    const { error: updateError } = await supabaseClient
      .from('gameweek_live_performance')
      .update({ modified: false })
      .in('id', performances.map(p => p.id));

    if (updateError) throw updateError;

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