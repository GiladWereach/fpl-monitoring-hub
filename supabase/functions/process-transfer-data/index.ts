import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferDelta {
  player_id: number;
  start_timestamp: Date;
  end_timestamp: Date;
  net_transfer_delta: number;
  ownership_delta: number;
  transfer_velocity: number;
}

interface ProcessingResult {
  success: boolean;
  player_id: number;
  error?: string;
  metrics: TransferDelta;
}

interface ProcessingError {
  player_id: number;
  error_type: 'CALCULATION' | 'DATA_MISSING' | 'VALIDATION';
  timestamp: Date;
  details: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting transfer data processing...');

    // Get active players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, web_name')
      .eq('removed', false);

    if (playersError) throw playersError;

    console.log(`Processing ${players.length} players...`);

    const results: ProcessingResult[] = [];
    const errors: ProcessingError[] = [];

    // Process each player
    for (const player of players) {
      try {
        console.log(`Processing player ${player.id} (${player.web_name})...`);
        const metrics = await calculateTransferTrends(supabase, player.id);
        results.push({
          success: true,
          player_id: player.id,
          metrics
        });
      } catch (error) {
        console.error(`Error processing player ${player.id}:`, error);
        errors.push({
          player_id: player.id,
          error_type: 'CALCULATION',
          timestamp: new Date(),
          details: error.message
        });
        results.push({
          success: false,
          player_id: player.id,
          error: error.message,
          metrics: null
        });
      }
    }

    // Log calculation completion
    const executionTime = performance.now() - startTime;
    const { error: logError } = await supabase
      .from('calculation_logs')
      .insert({
        calculation_type_id: 3,
        status: 'completed',
        affected_rows: results.length,
        performance_metrics: {
          execution_time: executionTime,
          processed_players: results.length,
          success_count: results.filter(r => r.success).length,
          error_count: errors.length
        }
      });

    if (logError) throw logError;

    await cleanupOldData(supabase);

    console.log('Transfer data processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transfer data processing completed',
        results,
        execution_time: executionTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in transfer data processing:', error);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('calculation_logs')
      .insert({
        calculation_type_id: 3,
        status: 'error',
        error_message: error.message,
        performance_metrics: {
          execution_time: performance.now() - startTime
        }
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process transfer data',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function calculateTransferTrends(
  supabase: any,
  player_id: number
): Promise<TransferDelta> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Changed to 7 days

  // Get transfer history for last 7 days
  const { data: transfers, error: transferError } = await supabase
    .from('transfer_history')
    .select('*')
    .eq('player_id', player_id)
    .gte('timestamp', sevenDaysAgo.toISOString())
    .order('timestamp', { ascending: true });

  if (transferError) throw transferError;

  // Handle insufficient data more gracefully
  if (!transfers || transfers.length === 0) {
    return {
      player_id,
      start_timestamp: now,
      end_timestamp: now,
      net_transfer_delta: 0,
      ownership_delta: 0,
      transfer_velocity: 0
    };
  }

  // Calculate metrics even with just one data point
  const netTransfers = transfers.reduce((acc, curr) => 
    acc + (curr.transfers_in_delta - curr.transfers_out_delta), 0);

  const ownershipDelta = transfers.length > 1 ? 
    transfers[transfers.length - 1].ownership_percent - transfers[0].ownership_percent :
    0;

  const hoursDifference = transfers.length > 1 ?
    (new Date(transfers[transfers.length - 1].timestamp).getTime() - new Date(transfers[0].timestamp).getTime()) / (1000 * 60 * 60) :
    24; // Default to 24 hours if only one data point
  
  const transferVelocity = netTransfers / hoursDifference;

  return {
    player_id,
    start_timestamp: transfers.length > 1 ? new Date(transfers[0].timestamp) : now,
    end_timestamp: transfers.length > 1 ? new Date(transfers[transfers.length - 1].timestamp) : now,
    net_transfer_delta: netTransfers,
    ownership_delta: ownershipDelta,
    transfer_velocity
  };
}

async function cleanupOldData(supabase: any) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error: cleanupError } = await supabase
    .from('transfer_history')
    .delete()
    .lt('timestamp', sevenDaysAgo.toISOString());

  if (cleanupError) {
    console.error('Error cleaning up old data:', cleanupError);
  }
}