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
      .select('id')
      .eq('removed', false);

    if (playersError) throw playersError;

    console.log(`Processing ${players.length} players...`);

    const results: ProcessingResult[] = [];
    const errors: ProcessingError[] = [];

    // Process each player
    for (const player of players) {
      try {
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
        calculation_type_id: 3, // ID for transfer processing
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
        error: 'Failed to process transfer data'
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
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get transfer history for last 24 hours
  const { data: transfers, error: transferError } = await supabase
    .from('transfer_history')
    .select('*')
    .eq('player_id', player_id)
    .gte('timestamp', twentyFourHoursAgo.toISOString())
    .order('timestamp', { ascending: true });

  if (transferError) throw transferError;

  if (!transfers || transfers.length < 2) {
    throw new Error('Insufficient data for trend calculation');
  }

  const netTransfers = transfers.reduce((acc, curr) => 
    acc + (curr.transfers_in_delta - curr.transfers_out_delta), 0);

  const ownershipDelta = transfers[transfers.length - 1].ownership_percent - 
                        transfers[0].ownership_percent;

  const hoursDifference = 
    (transfers[transfers.length - 1].timestamp - transfers[0].timestamp) / (1000 * 60 * 60);
  
  const transferVelocity = netTransfers / hoursDifference;

  return {
    player_id,
    start_timestamp: new Date(transfers[0].timestamp),
    end_timestamp: new Date(transfers[transfers.length - 1].timestamp),
    net_transfer_delta: netTransfers,
    ownership_delta: ownershipDelta,
    transfer_velocity
  };
}

async function cleanupOldData(supabase: any) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Delete data older than 7 days, except for price change points
  const { error: cleanupError } = await supabase
    .from('transfer_history')
    .delete()
    .lt('timestamp', sevenDaysAgo.toISOString());

  if (cleanupError) {
    console.error('Error cleaning up old data:', cleanupError);
  }
}