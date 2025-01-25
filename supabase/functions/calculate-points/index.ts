import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { logDebug, logError } from './logging.ts';
import { calculatePlayerPoints } from './services/points-service.ts';
import { 
  getScoringRules, 
  getPerformances, 
  upsertPointsCalculations,
  updatePerformanceStatus 
} from './services/database-service.ts';

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

    // Get scoring rules and performances
    const rules = await getScoringRules(supabaseClient);
    const performances = await getPerformances(supabaseClient);

    if (!performances.length) {
      return new Response(
        JSON.stringify({ message: 'No performances to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group performances by fixture for BPS calculations
    const fixturePerformances = performances.reduce((acc, perf) => {
      if (!perf.fixture_id) return acc;
      if (!acc[perf.fixture_id]) acc[perf.fixture_id] = [];
      acc[perf.fixture_id].push(perf);
      return acc;
    }, {} as Record<number, typeof performances>);

    // Calculate points for each performance
    const pointsCalculations = [];
    for (const perf of performances) {
      try {
        const fixturePerfs = perf.fixture_id ? fixturePerformances[perf.fixture_id] : [];
        const calculation = await calculatePlayerPoints(perf, rules, fixturePerfs);
        
        pointsCalculations.push({
          event_id: perf.event_id,
          player_id: perf.player_id,
          fixture_id: perf.fixture_id,
          ...calculation,
          last_updated: new Date().toISOString()
        });
      } catch (error) {
        logError('calculate-points', `Error processing player ${perf.player_id}:`, error);
      }
    }

    // Update database
    await upsertPointsCalculations(supabaseClient, pointsCalculations);
    await updatePerformanceStatus(supabaseClient, performances.map(p => p.id));

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: performances.length,
        calculations: pointsCalculations.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError('calculate-points', 'Error in points calculation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});