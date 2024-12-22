import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";
import type { APIErrorType } from "@/utils/api/errorHandling";
import type { Json } from "@/integrations/supabase/types";

interface ExecutionConfig {
  retry_count: number;
  timeout_seconds: number;
  retry_delay_seconds: number;
  concurrent_execution: boolean;
  retry_backoff: 'linear' | 'exponential' | 'fixed';
  max_retry_delay: number;
}

interface TestResult {
  success: boolean;
  error?: string;
  executionTime?: number;
  retryCount?: number;
}

async function verifyScheduleConfig(functionName: string, scheduleType: string): Promise<boolean> {
  console.log(`Verifying schedule configuration for ${functionName}`);
  
  const { data: schedule, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('function_name', functionName)
    .single();

  if (error) {
    console.error(`Error verifying schedule config: ${error.message}`);
    return false;
  }

  return schedule.schedule_type === scheduleType && schedule.enabled;
}

async function testTimeBasedSchedule(functionName: string): Promise<TestResult> {
  console.log(`Testing time-based schedule for ${functionName}`);
  const startTime = Date.now();

  try {
    // Verify basic schedule setup
    const configValid = await verifyScheduleConfig(functionName, 'time_based');
    if (!configValid) {
      throw new Error('Invalid schedule configuration');
    }

    // Test execution
    const { data: executionResult, error: executionError } = await supabase.functions.invoke(
      'process-schedules',
      {
        body: { 
          scheduleId: functionName,
          test: true,
          scheduleType: 'time_based'
        }
      }
    );

    if (executionError) throw executionError;

    const executionTime = Date.now() - startTime;
    await updateAPIHealthMetrics(functionName, true, executionTime);

    return {
      success: true,
      executionTime,
      retryCount: 0
    };

  } catch (error) {
    console.error(`Error testing time-based schedule for ${functionName}:`, error);
    
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

async function testEventBasedSchedule(functionName: string): Promise<TestResult> {
  console.log(`Testing event-based schedule for ${functionName}`);
  const startTime = Date.now();

  try {
    // Verify basic schedule setup
    const configValid = await verifyScheduleConfig(functionName, 'event_based');
    if (!configValid) {
      throw new Error('Invalid schedule configuration');
    }

    // Test with simulated event trigger
    const { data: executionResult, error: executionError } = await supabase.functions.invoke(
      'process-schedules',
      {
        body: { 
          scheduleId: functionName,
          test: true,
          scheduleType: 'event_based',
          eventTrigger: {
            type: 'test_event',
            timestamp: new Date().toISOString()
          }
        }
      }
    );

    if (executionError) throw executionError;

    const executionTime = Date.now() - startTime;
    await updateAPIHealthMetrics(functionName, true, executionTime);

    return {
      success: true,
      executionTime,
      retryCount: 0
    };

  } catch (error) {
    console.error(`Error testing event-based schedule for ${functionName}:`, error);
    
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

export async function testScheduleExecution(
  functionName: string, 
  scheduleType: "time_based" | "event_based"
): Promise<TestResult> {
  console.log(`Testing schedule execution for ${functionName} (${scheduleType})`);
  
  try {
    const result = scheduleType === 'time_based' 
      ? await testTimeBasedSchedule(functionName)
      : await testEventBasedSchedule(functionName);

    if (!result.success) {
      toast({
        title: "Schedule Test Failed",
        description: `Failed to test ${scheduleType} schedule for ${functionName}: ${result.error}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Schedule Test Successful",
        description: `Successfully tested ${scheduleType} schedule for ${functionName}`,
      });
    }

    return result;

  } catch (error) {
    console.error(`Error in schedule test execution:`, error);
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
    const executionConfig: ExecutionConfig = {
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
        schedule_type: 'time_based' as const,
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

      // Verify retry count matches configuration
      const execConfig = schedule.execution_config as unknown as ExecutionConfig;
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