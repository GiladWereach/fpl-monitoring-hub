import { supabase } from "@/integrations/supabase/client";
import { TestResult } from "../types/scheduling";
import { toast } from "@/hooks/use-toast";

export async function testScheduleExecution(
  functionName: string,
  scheduleType: "time_based" | "event_based"
): Promise<TestResult> {
  console.log(`Testing schedule execution for ${functionName} (${scheduleType})`);
  const startTime = Date.now();

  try {
    // Verify schedule exists and is configured correctly
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('function_name', functionName)
      .single();

    if (scheduleError) {
      throw scheduleError;
    }

    if (!schedule || schedule.schedule_type !== scheduleType) {
      throw new Error(`Invalid schedule configuration for ${functionName}`);
    }

    // Test execution
    const { error: executionError } = await supabase.functions.invoke(
      'process-schedules',
      {
        body: {
          scheduleId: schedule.id,
          test: true
        }
      }
    );

    if (executionError) throw executionError;

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      executionTime,
      functionName,
      scheduleType,
      retryCount: 0
    };

  } catch (error) {
    console.error(`Error testing ${scheduleType} schedule for ${functionName}:`, error);
    
    toast({
      title: "Test Execution Failed",
      description: error.message,
      variant: "destructive",
    });

    return {
      success: false,
      error: error.message,
      functionName,
      scheduleType
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
        schedule_type: 'time_based',
        enabled: true,
        execution_config: {
          retry_count: 3,
          timeout_seconds: 5,
          retry_delay_seconds: 2,
          concurrent_execution: false,
          retry_backoff: 'exponential',
          max_retry_delay: 10
        }
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
    
    toast({
      title: "Retry Test Failed",
      description: error.message,
      variant: "destructive",
    });

    return {
      success: false,
      error: error.message,
      functionName,
      retryCount
    };
  }
}