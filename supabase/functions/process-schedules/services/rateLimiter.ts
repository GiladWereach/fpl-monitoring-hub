import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../shared/logging-service.ts';

interface RateLimitConfig {
  maxRequests: number;
  intervalSeconds: number;
}

export async function checkRateLimit(
  supabaseClient: ReturnType<typeof createClient>,
  functionName: string,
  config: RateLimitConfig
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.intervalSeconds * 1000);
  
  try {
    // Count recent executions
    const { count, error: countError } = await supabaseClient
      .from('schedule_execution_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'running')
      .gt('started_at', windowStart.toISOString())
      .eq('execution_context->function_name', functionName);

    if (countError) {
      logError('rate-limiter', `Error checking rate limit for ${functionName}:`, countError);
      return false;
    }

    const isWithinLimit = (count || 0) < config.maxRequests;
    
    if (!isWithinLimit) {
      logDebug('rate-limiter', `Rate limit exceeded for ${functionName}. Count: ${count}, Limit: ${config.maxRequests}`);
    }

    return isWithinLimit;
  } catch (error) {
    logError('rate-limiter', `Error in rate limiter for ${functionName}:`, error);
    return false;
  }
}