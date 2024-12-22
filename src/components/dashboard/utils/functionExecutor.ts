import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logFunctionExecution, updateExecutionLog } from "./executionLogger";
import { logAPIError, updateAPIHealthMetrics } from "@/utils/api/errorHandling";
import { APIError } from "@/utils/api/errorHandling";
import { runScheduleTests, generateTestReport } from './scheduleTestRunner';
import { 
  handleSchedulerError, 
  calculateBackoff, 
  cleanupResources,
  SchedulerError,
  errorClassification 
} from "@/utils/errorHandling";
import { metricsService } from "@/services/metricsService";
import { cacheService } from "@/services/cacheService";
import { rateLimiterService } from "@/services/rateLimiterService";
import { alertingService } from "@/services/alertingService";

interface EdgeFunctionResponse {
  data: any;
  error: Error | null;
}

export const executeFetchFunction = async (functionName: string, options: { 
  isTest?: boolean,
  scheduleType?: "time_based" | "event_based" 
} = {}) => {
  const started_at = new Date().toISOString();
  let scheduleId: string | undefined;
  const startTime = Date.now();
  let attempt = 1;
  const maxAttempts = 3;

  if (options.isTest) {
    console.log(`Running test execution for ${functionName}`);
    const testSuites = [{
      functionName,
      scheduleTypes: options.scheduleType ? [options.scheduleType] : ['time_based', 'event_based'] as const
    }];
    
    const testResults = await runScheduleTests(testSuites);
    const report = generateTestReport(testResults);
    
    console.log(`Test execution completed for ${functionName}:`, report);
    return { success: report.failedTests === 0, data: report };
  }

  // Check rate limit
  if (!rateLimiterService.tryAcquire(functionName)) {
    const error = new SchedulerError({
      ...errorClassification.RATE_LIMIT_ERROR,
      message: `Rate limit exceeded for ${functionName}`
    });
    alertingService.alert(
      'RATE_LIMIT',
      'warning',
      `Rate limit exceeded for ${functionName}`,
      { endpoint: functionName }
    );
    throw error;
  }

  try {
    console.log(`Executing function: ${functionName}`);
    scheduleId = await logFunctionExecution(functionName, started_at);
    
    if (!scheduleId) {
      throw new SchedulerError({
        ...errorClassification.VALIDATION_ERROR,
        message: "Failed to create or find schedule for execution logging"
      });
    }

    // Check cache first
    const cachedResult = cacheService.get<any>(functionName);
    if (cachedResult) {
      console.log(`Cache hit for ${functionName}`);
      metricsService.recordMetric(functionName, {
        cacheHitRate: 1,
        executionTimeMs: 0,
        successRate: 1,
        errorRate: 0
      });
      return { success: true, data: cachedResult };
    }

    while (attempt <= maxAttempts) {
      try {
        const { data: currentMetrics } = await supabase
          .from('api_health_metrics')
          .select('*')
          .eq('endpoint', functionName)
          .maybeSingle();

        const response = await Promise.race<EdgeFunctionResponse>([
          supabase.functions.invoke<EdgeFunctionResponse>(functionName),
          new Promise((_, reject) => 
            setTimeout(() => reject(new SchedulerError(errorClassification.TIMEOUT_ERROR)), 30000)
          )
        ]);
        
        if (response.error) throw response.error;
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Cache successful response
        cacheService.set(functionName, response.data);

        // Record metrics
        metricsService.recordMetric(functionName, {
          executionTimeMs: duration,
          successRate: 1,
          errorRate: 0,
          cacheHitRate: 0
        });

        if (scheduleId) {
          await updateExecutionLog(scheduleId, true);
        }

        await cleanupResources(functionName);

        toast({
          title: "Success",
          description: `${functionName} executed successfully`,
        });

        return { success: true, data: response.data };
      } catch (error) {
        metricsService.recordMetric(functionName, {
          executionTimeMs: Date.now() - startTime,
          successRate: 0,
          errorRate: 1,
          cacheHitRate: 0
        });

        await handleSchedulerError(error, { functionName, attempt, maxAttempts });
        
        const backoffDelay = calculateBackoff(attempt, 'exponential');
        console.log(`Retrying ${functionName} after ${backoffDelay}ms (attempt ${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        attempt++;
      }
    }

    const maxRetriesError = new SchedulerError({
      code: 'MAX_RETRIES_EXCEEDED',
      message: `Failed to execute ${functionName} after ${maxAttempts} attempts`,
      severity: 'high',
      retryable: false
    });

    alertingService.alert(
      'MAX_RETRIES_EXCEEDED',
      'error',
      `Failed to execute ${functionName} after ${maxAttempts} attempts`,
      { endpoint: functionName }
    );

    throw maxRetriesError;
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    
    const { data: currentMetrics } = await supabase
      .from('api_health_metrics')
      .select('*')
      .eq('endpoint', functionName)
      .maybeSingle();

    const currentErrorPattern = typeof currentMetrics?.error_pattern === 'object' && currentMetrics?.error_pattern !== null 
      ? currentMetrics.error_pattern 
      : {};

    const newMetrics = {
      endpoint: functionName,
      success_count: currentMetrics?.success_count || 0,
      error_count: (currentMetrics?.error_count || 0) + 1,
      avg_response_time: currentMetrics?.avg_response_time || 0,
      last_success_time: currentMetrics?.last_success_time,
      last_error_time: new Date().toISOString(),
      error_pattern: {
        ...currentErrorPattern,
        last_error: error instanceof Error ? error.message : String(error)
      }
    };

    await supabase
      .from('api_health_metrics')
      .upsert(newMetrics);

    const apiError: APIError = {
      type: 'SERVER_ERROR',
      message: error instanceof Error ? error.message : String(error),
      endpoint: functionName,
      statusCode: error instanceof SchedulerError ? 500 : 500,
      retryCount: attempt - 1,
      requestParams: {}
    };

    await logAPIError(apiError);
    
    if (scheduleId) {
      await updateExecutionLog(scheduleId, false, error instanceof Error ? error.message : String(error));
    }

    await cleanupResources(functionName);

    alertingService.alert(
      'EXECUTION_ERROR',
      'error',
      `Failed to execute ${functionName}: ${error instanceof Error ? error.message : String(error)}`,
      { endpoint: functionName }
    );

    toast({
      title: "Error",
      description: `Failed to execute ${functionName}: ${error instanceof Error ? error.message : String(error)}`,
      variant: "destructive",
    });

    return { success: false, error };
  }
};
