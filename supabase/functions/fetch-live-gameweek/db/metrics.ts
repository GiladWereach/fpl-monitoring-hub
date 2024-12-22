import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../logging.ts';

export async function recordMetrics(
  supabaseClient: ReturnType<typeof createClient>,
  eventId: number,
  metrics: {
    processedPlayers: number;
    updatedRecords: number;
    processingTimeMs: number;
  }
) {
  try {
    const { error } = await supabaseClient
      .from('api_health_metrics')
      .insert({
        endpoint: 'fetch-live-gameweek',
        success_count: metrics.processedPlayers,
        error_count: 0,
        avg_response_time: metrics.processingTimeMs,
        error_pattern: {},
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    
    logDebug('fetch-live-gameweek', 'Recorded metrics:', metrics);
  } catch (error) {
    logError('fetch-live-gameweek', 'Error recording metrics:', error);
    // Don't throw - metrics recording should not break the main flow
  }
}