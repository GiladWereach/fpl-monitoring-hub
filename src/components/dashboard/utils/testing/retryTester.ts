import { supabase } from "@/integrations/supabase/client";
import { TestResult } from '../../types/scheduling';
import { logAPIError } from '@/utils/api/errorHandling';
import type { Json } from "@/integrations/supabase/types";

export async function verifyRetryMechanism(functionName: string): Promise<TestResult> {
  console.log(`Verifying retry mechanism for ${functionName}`);
  const startTime = Date.now();
  let retryCount = 0;

  try {
    const executionConfig = {
      retry_count: 3,
      timeout_seconds: 5,
      retry_delay_seconds: 2,
      concurrent_execution: false,
      retry_backoff: 'exponential',
      max_retry_delay: 10
    };

    // Create test schedule with retry configuration
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        function_name: functionName,
        schedule_type: 'time_based',
        enabled: true,
        execution_config: executionConfig as unknown as Json
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // Force failure to test retry
    const { error: executionError } = await supabase.functions.invoke(
      'process-schedules',
      {
        body: { 
          scheduleId: schedule.id, 
          test: true,
          forceError: true 
        }
      }
    );

    if (executionError) {
      // Check execution logs for retry attempts
      const { data: logs } = await supabase
        .from('schedule_execution_logs')
        .select('*')
        .eq('schedule_id', schedule.id)
        .order('created_at', { ascending: false });

      retryCount = logs?.length || 0;
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      executionTime,
      retryCount,
      functionName
    };

  } catch (error) {
    console.error(`Error verifying retry mechanism for ${functionName}:`, error);
    
    await logAPIError({
      type: 'RETRY_TEST_ERROR',
      message: error.message,
      endpoint: functionName,
      statusCode: error.status || 500,
      retryCount
    });

    return {
      success: false,
      error: error.message,
      retryCount,
      functionName
    };
  }
}