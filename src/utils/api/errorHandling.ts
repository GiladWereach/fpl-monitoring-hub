export type APIErrorType = 
  | 'RATE_LIMIT' 
  | 'AUTH_ERROR' 
  | 'SERVER_ERROR' 
  | 'TIMEOUT' 
  | 'NETWORK' 
  | 'VALIDATION'
  | 'TEST_ERROR'
  | 'RETRY_TEST_ERROR';

export interface APIError {
  type: APIErrorType;
  message: string;
  endpoint: string;
  statusCode: number;
  retryCount: number;
  requestParams?: Record<string, unknown>;
}

export const logAPIError = async (error: APIError): Promise<void> => {
  console.error(`API Error [${error.type}] in ${error.endpoint}:`, error.message);
  
  try {
    const { error: insertError } = await supabase
      .from('api_error_logs')
      .insert({
        error_type: error.type,
        endpoint: error.endpoint,
        error_details: error.message,
        response_code: error.statusCode,
        retry_count: error.retryCount,
        request_params: error.requestParams
      });

    if (insertError) {
      console.error('Failed to log API error:', insertError);
    }
  } catch (e) {
    console.error('Error logging API error:', e);
  }
};

export const updateAPIHealthMetrics = async (
  endpoint: string,
  success: boolean,
  duration?: number
): Promise<void> => {
  try {
    const { data: currentMetrics, error: fetchError } = await supabase
      .from('api_health_metrics')
      .select('*')
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching metrics:', fetchError);
      return;
    }

    const { error: upsertError } = await supabase
      .from('api_health_metrics')
      .upsert({
        endpoint,
        success_count: (currentMetrics?.success_count || 0) + (success ? 1 : 0),
        error_count: (currentMetrics?.error_count || 0) + (success ? 0 : 1),
        avg_response_time: duration || currentMetrics?.avg_response_time || 0,
        last_success_time: success ? new Date().toISOString() : currentMetrics?.last_success_time,
        last_error_time: !success ? new Date().toISOString() : currentMetrics?.last_error_time
      });

    if (upsertError) {
      console.error('Error updating metrics:', upsertError);
    }
  } catch (e) {
    console.error('Error updating API health metrics:', e);
  }
};