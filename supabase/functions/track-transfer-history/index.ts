import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferData {
  player_id: number;
  transfers_in_delta: number;
  transfers_out_delta: number;
  ownership_percent: number;
  current_price: number;
  gameweek: number;
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting transfer history tracking...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current gameweek
    const { data: currentEvent, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .single();

    if (eventError) {
      console.error('Error fetching current event:', eventError);
      throw new Error('Failed to fetch current event');
    }

    if (!currentEvent) {
      console.error('No current event found');
      throw new Error('No current event found');
    }

    console.log('Current event:', currentEvent);

    // Get all active players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, now_cost, selected_by_percent, transfers_in_event, transfers_out_event')
      .eq('removed', false);

    if (playersError) {
      console.error('Error fetching players:', playersError);
      throw new Error('Failed to fetch players');
    }

    if (!players || players.length === 0) {
      console.error('No players found');
      throw new Error('No players found');
    }

    console.log(`Processing ${players.length} players for transfer history...`);

    const currentTimestamp = new Date().toISOString();
    const transferData: TransferData[] = players.map(player => ({
      player_id: player.id,
      transfers_in_delta: player.transfers_in_event || 0,
      transfers_out_delta: player.transfers_out_event || 0,
      ownership_percent: parseFloat(player.selected_by_percent) || 0,
      current_price: player.now_cost || 0,
      gameweek: currentEvent.id,
      timestamp: currentTimestamp
    }));

    // Insert transfer history records
    const { error: insertError } = await supabase
      .from('transfer_history')
      .insert(transferData);

    if (insertError) {
      console.error('Error inserting transfer history:', insertError);
      throw new Error('Failed to insert transfer history');
    }

    console.log(`Successfully inserted ${transferData.length} transfer history records`);

    // Log calculation completion
    const { error: logError } = await supabase
      .from('calculation_logs')
      .insert({
        calculation_type_id: 2,
        status: 'completed',
        affected_rows: transferData.length,
        performance_metrics: {
          execution_time: Date.now() - performance.now(),
          processed_players: transferData.length
        }
      });

    if (logError) {
      console.error('Error logging calculation:', logError);
      // Don't throw here as the main operation succeeded
    }

    console.log('Transfer history tracking completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Transfer history tracking completed',
        processed_players: transferData.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in transfer history tracking:', error);

    // Log error in calculation logs
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
      await supabase
        .from('calculation_logs')
        .insert({
          calculation_type_id: 2,
          status: 'error',
          error_message: error.message,
          performance_metrics: {
            execution_time: Date.now() - performance.now()
          }
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to track transfer history'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});