import { supabase } from "@/integrations/supabase/client";
import { TestResult } from '../../types/scheduling';
import { verifyScheduleConfig } from './configValidator';
import { updateAPIHealthMetrics, logAPIError } from '@/utils/api/errorHandling';

export async function executeScheduleTest(
  functionName: string, 
  scheduleType: "time_based" | "event_based"
): Promise<TestResult> {
  console.log(`Testing schedule execution for ${functionName} (${scheduleType})`);
  const startTime = Date.now();
  
  try {
    // Verify basic schedule setup
    const configValid = await verifyScheduleConfig(functionName, scheduleType);
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
          scheduleType,
          ...(scheduleType === 'event_based' && {
            eventTrigger: {
              type: 'test_event',
              timestamp: new Date().toISOString()
            }
          })
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
    console.error(`Error testing ${scheduleType} schedule for ${functionName}:`, error);
    
    await logAPIError({
      type: 'TEST_ERROR',
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