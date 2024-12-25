import { SupabaseClient } from '@supabase/supabase-js';
import { logDebug, logError } from '../../../shared/logging-service';
import { ExecutionResult } from './types/processor-types';
import { calculateBackoff } from '../utils/retry';

export async function executeFunction(
  client: SupabaseClient,
  schedule: any,
  instanceId: string,
  attempt: number
): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    logDebug('execution-service', `Executing ${schedule.function_name} (attempt ${attempt})`);
    
    const { error: invokeError } = await client.functions.invoke(
      schedule.function_name,
      {
        body: { 
          scheduled: true,
          context: {
            instance_id: instanceId,
            attempt,
            schedule_type: schedule.schedule_type
          }
        }
      }
    );

    if (invokeError) throw invokeError;

    const duration = Date.now() - startTime;
    logDebug('execution-service', `Successfully executed ${schedule.function_name} in ${duration}ms`);

    return {
      success: true,
      duration
    };
  } catch (error) {
    logError('execution-service', `Error executing ${schedule.function_name}:`, error);
    return {
      success: false,
      error,
      duration: Date.now() - startTime
    };
  }
}