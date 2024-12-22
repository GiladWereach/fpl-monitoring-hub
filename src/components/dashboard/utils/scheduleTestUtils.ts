import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";
import type { APIErrorType } from "@/utils/api/errorHandling";

interface TestResult {
  success: boolean;
  error?: string;
  executionTime?: number;
  retryCount?: number;
}

interface ExecutionConfig {
  retry_count: number;
  timeout_seconds: number;
  retry_delay_seconds: number;
  concurrent_execution: boolean;
  retry_backoff: 'linear' | 'exponential' | 'fixed';
  max_retry_delay: number;
}

export async function testScheduleExecution(functionName: string, scheduleType: "time_based" | "event_based"): Promise<TestResult> {
  console.log(`Testing schedule execution for ${functionName} (${scheduleType})`);
  const startTime = Date.now();
  
  try {
    // Create test schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        function_name: functionName,
        schedule_type: scheduleType,
        enabled: true,
        execution_config: {
          retry_count: 3,
          timeout_seconds: 30,
          retry_delay_seconds: 60,
          concurrent_execution: false,
          retry_backoff: 'linear',
          max_retry_delay: 3600
        } as ExecutionConfig
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // Execute the schedule
    const { data: executionResult, error: executionError } = await supabase.functions.invoke(
      'process-schedules',
      {
        body: { scheduleId: schedule.id, test: true }
      }
    );

    if (executionError) throw executionError;

    const executionTime = Date.now() - startTime;

    // Log success metrics
    await updateAPIHealthMetrics(functionName, true, executionTime);

    return {
      success: true,
      executionTime,
      retryCount: 0
    };

  } catch (error) {
    console.error(`Error testing schedule for ${functionName}:`, error);
    
    // Log error metrics
    await logAPIError({
      type: 'TEST_ERROR' as APIErrorType,
      message: error.message,
      endpoint: functionName,
      statusCode: error.status || 500,
      retryCount: 0
    });

    return {
      success: false,
      error: error.message
    };
  }
}

export async function verifyRetryMechanism(functionName: string): Promise<TestResult> {
  console.log(`Verifying retry mechanism for ${functionName}`);
  const startTime = Date.now();
  let retryCount = 0;

  try {
    // Create test schedule with retry configuration
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .insert({
        function_name: functionName,
        schedule_type: 'time_based' as const,
        enabled: true,
        execution_config: {
          retry_count: 3,
          timeout_seconds: 5,
          retry_delay_seconds: 2,
          concurrent_execution: false,
          retry_backoff: 'exponential',
          max_retry_delay: 10
        } as ExecutionConfig
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

      // Verify retry count matches configuration
      const execConfig = schedule.execution_config as ExecutionConfig;
      if (retryCount !== execConfig.retry_count + 1) {
        throw new Error(`Expected ${execConfig.retry_count + 1} attempts, got ${retryCount}`);
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      executionTime,
      retryCount
    };

  } catch (error) {
    console.error(`Error verifying retry mechanism for ${functionName}:`, error);
    
    await logAPIError({
      type: 'RETRY_TEST_ERROR' as APIErrorType,
      message: error.message,
      endpoint: functionName,
      statusCode: error.status || 500,
      retryCount
    });

    return {
      success: false,
      error: error.message,
      retryCount
    };
  }
}