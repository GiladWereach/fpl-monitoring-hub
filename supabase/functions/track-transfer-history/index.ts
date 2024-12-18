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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting transfer history tracking...');

    // Get current gameweek
    const { data: currentEvent, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('is_current', true)
      .single();

    if (eventError) throw eventError;

    // Get all active players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, now_cost, selected_by_percent, transfers_in_event, transfers_out_event')
      .eq('removed', false);

    if (playersError) throw playersError;

    console.log(`Processing ${players.length} players for transfer history...`);

    const transferData: TransferData[] = players.map(player => ({
      player_id: player.id,
      transfers_in_delta: player.transfers_in_event || 0,
      transfers_out_delta: player.transfers_out_event || 0,
      ownership_percent: parseFloat(player.selected_by_percent) || 0,
      current_price: player.now_cost || 0,
      gameweek: currentEvent.id
    }));

    // Insert transfer history records
    const { error: insertError } = await supabase
      .from('transfer_history')
      .insert(transferData);

    if (insertError) throw insertError;

    // Log calculation completion
    const { error: logError } = await supabase
      .from('calculation_logs')
      .insert({
        calculation_type_id: 2, // ID from the calculation_types table
        status: 'completed',
        affected_rows: transferData.length,
        performance_metrics: {
          execution_time: Date.now() - performance.now(),
          processed_players: transferData.length
        }
      });

    if (logError) throw logError;

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

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to track transfer history' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});