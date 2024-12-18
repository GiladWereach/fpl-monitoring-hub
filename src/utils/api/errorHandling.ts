import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type APIErrorType = 'RATE_LIMIT' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'TIMEOUT' | 'NETWORK' | 'VALIDATION';

export interface APIError {
  type: APIErrorType;
  message: string;
  endpoint: string;
  statusCode?: number;
  retryCount?: number;
  requestParams?: Record<string, unknown>;
}

export async function logAPIError(error: APIError) {
  console.error(`API Error [${error.type}]:`, error);
  
  try {
    const { error: dbError } = await supabase
      .from('api_error_logs')
      .insert({
        error_type: error.type,
        endpoint: error.endpoint,
        request_params: error.requestParams as Database["public"]["Tables"]["api_error_logs"]["Insert"]["request_params"],
        response_code: error.statusCode,
        retry_count: error.retryCount || 0,
        error_details: error.message
      });

    if (dbError) {
      console.error('Error logging API error:', dbError);
    }

    // Update health metrics
    await updateAPIHealthMetrics(error.endpoint, false);
  } catch (loggingError) {
    console.error('Error in error logging:', loggingError);
  }
}

export async function updateAPIHealthMetrics(
  endpoint: string,
  success: boolean,
  responseTime?: number
) {
  try {
    const timestamp = new Date().toISOString();
    const { data: existing } = await supabase
      .from('api_health_metrics')
      .select()
      .eq('endpoint', endpoint)
      .single();

    if (existing) {
      const updates = {
        ...(success 
          ? { 
              success_count: existing.success_count + 1,
              last_success_time: timestamp,
              avg_response_time: responseTime 
                ? (existing.avg_response_time * existing.success_count + responseTime) / (existing.success_count + 1)
                : existing.avg_response_time
            }
          : {
              error_count: existing.error_count + 1,
              last_error_time: timestamp
            })
      };

      await supabase
        .from('api_health_metrics')
        .update(updates)
        .eq('endpoint', endpoint);
    } else {
      await supabase
        .from('api_health_metrics')
        .insert({
          endpoint,
          success_count: success ? 1 : 0,
          error_count: success ? 0 : 1,
          avg_response_time: responseTime || 0,
          last_success_time: success ? timestamp : null,
          last_error_time: success ? null : timestamp
        });
    }
  } catch (error) {
    console.error('Error updating API health metrics:', error);
  }
}