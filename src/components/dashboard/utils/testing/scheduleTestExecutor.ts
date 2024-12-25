import { supabase } from "@/integrations/supabase/client";
import { TestResult } from '../../types/scheduling';
import { verifyScheduleConfig } from './configValidator';
import { updateAPIHealthMetrics, logAPIError } from '@/utils/api/errorHandling';
import { measureExecutionTime } from './performanceMonitor';

export async function executeScheduleTest(
  functionName: string, 
  scheduleType: "time_based" | "event_based"
): Promise<TestResult> {
  console.log(`Testing schedule execution for ${functionName} (${scheduleType})`);
  
  try {
    return await measureExecutionTime(async () => {
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

      await updateAPIHealthMetrics(functionName, true);

      return {
        success: true,
        executionTime: 0,  // Will be populated by measureExecutionTime
        retryCount: 0,
        functionName
      };
    }, `${functionName}_${scheduleType}_test`);

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
      error: error.message,
      functionName
    };
  }
}