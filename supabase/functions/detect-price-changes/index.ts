import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceChangeDetection {
  player_id: number;
  old_price: number;
  new_price: number;
  net_transfers: number;
  ownership: number;
  transfer_velocity: number;
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

    console.log('Starting price change detection...');

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
      .select('*')
      .eq('removed', false);

    if (playersError) throw playersError;

    const priceChanges: PriceChangeDetection[] = [];

    // Process each player
    for (const player of players) {
      try {
        // Get last price change record
        const { data: lastPriceChange } = await supabase
          .from('price_changes')
          .select('*')
          .eq('player_id', player.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        // Get transfer history for velocity calculation
        const { data: transfers } = await supabase
          .from('transfer_history')
          .select('*')
          .eq('player_id', player.id)
          .order('timestamp', { ascending: false })
          .limit(24); // Last 24 records for hourly data

        if (!transfers?.length) continue;

        // Calculate transfer velocity (transfers per hour)
        const netTransfers = transfers.reduce((acc, curr) => 
          acc + (curr.transfers_in_delta - curr.transfers_out_delta), 0);
        
        const hoursDiff = 
          (new Date(transfers[0].timestamp).getTime() - 
           new Date(transfers[transfers.length - 1].timestamp).getTime()) / (1000 * 60 * 60);
        
        const velocity = Math.round(netTransfers / hoursDiff);

        // Check if price has changed since last record
        if (!lastPriceChange || lastPriceChange.new_price !== player.now_cost) {
          priceChanges.push({
            player_id: player.id,
            old_price: lastPriceChange?.new_price || player.now_cost,
            new_price: player.now_cost,
            net_transfers: netTransfers,
            ownership: parseFloat(player.selected_by_percent),
            transfer_velocity: velocity
          });
        }
      } catch (error) {
        console.error(`Error processing player ${player.id}:`, error);
      }
    }

    // Record detected price changes
    if (priceChanges.length > 0) {
      const { error: insertError } = await supabase
        .from('price_changes')
        .insert(priceChanges.map(change => ({
          player_id: change.player_id,
          old_price: change.old_price,
          new_price: change.new_price,
          timestamp: new Date().toISOString(),
          gameweek: currentEvent.id,
          net_transfers: change.net_transfers,
          ownership_at_change: change.ownership,
          transfer_velocity: change.transfer_velocity
        })));

      if (insertError) throw insertError;
    }

    // Log calculation completion
    await supabase
      .from('calculation_logs')
      .insert({
        calculation_type_id: 3, // Price Change Detection
        status: 'completed',
        affected_rows: priceChanges.length,
        performance_metrics: {
          detected_changes: priceChanges.length,
          processed_players: players.length
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        detected_changes: priceChanges.length,
        changes: priceChanges
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in price change detection:', error);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('calculation_logs')
      .insert({
        calculation_type_id: 3,
        status: 'error',
        error_message: error.message
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to detect price changes'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});