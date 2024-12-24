import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchLiveGameweekData } from './api-client.ts';
import { getCurrentEvent } from './db/events.ts';
import { upsertLivePerformance } from './db/performance.ts';
import { mapPlayerDataToUpdate } from './utils.ts';
import { logDebug, logError } from './logging.ts';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }

  const functionName = 'fetch-live-gameweek';
  const startTime = Date.now();

  try {
    logDebug(functionName, 'Starting live gameweek data fetch...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const currentEvent = await getCurrentEvent(supabaseClient);
    
    if (!currentEvent) {
      logDebug(functionName, 'No current gameweek found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No current gameweek found',
          shouldProcess: false
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const data = await fetchLiveGameweekData(currentEvent.id);
    if (!data?.elements) {
      throw new Error('Invalid response format from FPL API');
    }

    const updates = data.elements.map(element => mapPlayerDataToUpdate(element, currentEvent.id));
    await upsertLivePerformance(supabaseClient, updates);

    const processingTime = Date.now() - startTime;
    logDebug(functionName, `Processing completed in ${processingTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Live gameweek data updated successfully',
        gameweek: currentEvent.id,
        updatedPlayers: updates.length,
        processingTime
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    logError(functionName, 'Error in fetch-live-gameweek:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    );
  }
});