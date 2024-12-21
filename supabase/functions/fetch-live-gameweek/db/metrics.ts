import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug } from '../logging.ts';

export async function updateAPIMetrics(
  supabaseClient: ReturnType<typeof createClient>,
  functionName: string,
  success: boolean,
  duration?: number
) {
  try {
    logDebug(functionName, `Updating API metrics - success: ${success}, duration: ${duration}ms`);
    
    // First try to get existing metrics
    const { data: existing, error: fetchError } = await supabaseClient
      .from('api_health_metrics')
      .select('*')
      .eq('endpoint', functionName)
      .maybeSingle(); // Changed from single() to maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching metrics for ${functionName}:`, fetchError);
      return;
    }

    const timestamp = new Date().toISOString();
    const updates = {
      endpoint: functionName,
      success_count: (existing?.success_count || 0) + (success ? 1 : 0),
      error_count: (existing?.error_count || 0) + (success ? 0 : 1),
      avg_response_time: duration 
        ? existing
          ? (existing.avg_response_time * existing.success_count + duration) / (existing.success_count + 1)
          : duration
        : existing?.avg_response_time || 0,
      last_success_time: success ? timestamp : existing?.last_success_time,
      last_error_time: !success ? timestamp : existing?.last_error_time
    };

    const { error: upsertError } = await supabaseClient
      .from('api_health_metrics')
      .upsert(updates);

    if (upsertError) {
      console.error(`Error updating metrics for ${functionName}:`, upsertError);
    }
  } catch (error) {
    console.error(`Error in updateAPIMetrics for ${functionName}:`, error);
  }
}