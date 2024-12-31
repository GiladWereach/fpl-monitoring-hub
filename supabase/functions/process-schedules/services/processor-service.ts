import { SupabaseClient } from '@supabase/supabase-js';
import { logDebug, logError, logInfo } from '../../../shared/logging-service';
import { ProcessingContext, ExecutionResult } from './types/processor-types';
import { detectMatchWindow } from './match-window-service';
import { executeFunction } from './execution-service';
import { acquireLock, releaseLock } from './lock-service';
import { getCurrentState, transitionState, cleanupStaleStates } from './state-management-service';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [30, 60, 120]; // Increasing delays in seconds

export async function processSchedule(
  client: SupabaseClient,
  schedule: any,
  instanceId: string
): Promise<boolean> {
  const startTime = Date.now();
  logInfo('schedule-processor', `Processing schedule: ${schedule.function_name}`, {
    scheduleId: schedule.id,
    instanceId
  });

  try {
    // Clean up any stale states first
    await cleanupStaleStates(client);

    // Try to acquire lock
    const lockAcquired = await acquireLock(
      client,
      schedule.id,
      instanceId,
      schedule.execution_config?.timeout_seconds || 300
    );

    if (!lockAcquired) {
      logDebug('schedule-processor', `Lock not acquired for ${schedule.function_name}`);
      return false;
    }

    const currentState = await getCurrentState(client, schedule.id);
    if (currentState !== 'idle' && currentState !== 'retry') {
      logDebug('schedule-processor', `Schedule ${schedule.function_name} not ready for execution, current state: ${currentState}`);
      await releaseLock(client, schedule.id, instanceId);
      return false;
    }

    // Transition to pending
    await transitionState(client, {
      schedule_id: schedule.id,
      from_state: currentState,
      to_state: 'pending',
      metadata: {
        instance_id: instanceId,
        started_at: new Date().toISOString()
      }
    });

    // Create execution log
    const { data: log, error: logError } = await client
      .from('schedule_execution_logs')
      .insert({
        schedule_id: schedule.id,
        status: 'running',
        execution_context: {
          instance_id: instanceId,
          schedule_type: schedule.schedule_type,
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (logError) throw logError;

    // Execute with retry logic
    let success = false;
    let lastError = null;
    let retryCount = 0;
    const maxRetries = schedule.execution_config?.retry_count || MAX_RETRIES;

    while (retryCount <= maxRetries) {
      try {
        await transitionState(client, {
          schedule_id: schedule.id,
          from_state: retryCount === 0 ? 'pending' : 'retry',
          to_state: 'running',
          metadata: { attempt: retryCount + 1 }
        });

        const result = await executeFunction(client, schedule, instanceId, retryCount + 1);
        
        if (result.success) {
          success = true;
          break;
        }
        
        lastError = result.error;
        retryCount++;
        
        if (retryCount <= maxRetries) {
          const delaySeconds = RETRY_DELAYS[retryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          logInfo('schedule-processor', `Retrying ${schedule.function_name} in ${delaySeconds}s (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
          
          await transitionState(client, {
            schedule_id: schedule.id,
            from_state: 'running',
            to_state: 'retry',
            metadata: { retry_count: retryCount, next_retry: new Date(Date.now() + delaySeconds * 1000).toISOString() }
          });
        }
      } catch (error) {
        lastError = error;
        retryCount++;
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount - 1] * 1000));
        }
      }
    }

    const executionTime = Date.now() - startTime;

    // Update execution log
    await client
      .from('schedule_execution_logs')
      .update({
        status: success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        execution_duration_ms: executionTime,
        error_details: lastError ? JSON.stringify(lastError) : null
      })
      .eq('id', log.id);

    // Final state transition
    await transitionState(client, {
      schedule_id: schedule.id,
      from_state: 'running',
      to_state: success ? 'completed' : (retryCount >= maxRetries ? 'max_retries' : 'failed'),
      metadata: {
        execution_time: executionTime,
        retries: retryCount,
        error: lastError ? JSON.stringify(lastError) : null
      }
    });

    // Always transition completed/failed states back to idle
    if (success || retryCount >= maxRetries) {
      await transitionState(client, {
        schedule_id: schedule.id,
        from_state: success ? 'completed' : 'max_retries',
        to_state: 'idle',
        metadata: {
          schedule_config: schedule.time_config,
          final_status: success ? 'success' : 'max_retries_reached'
        }
      });
    }

    // Release lock
    await releaseLock(client, schedule.id, instanceId);

    return success;
  } catch (error) {
    logError('schedule-processor', `Fatal error processing schedule ${schedule.function_name}:`, error);
    
    try {
      await transitionState(client, {
        schedule_id: schedule.id,
        from_state: 'running',
        to_state: 'failed',
        metadata: { error: error.message }
      });

      await transitionState(client, {
        schedule_id: schedule.id,
        from_state: 'failed',
        to_state: 'idle',
        metadata: { reason: 'fatal_error' }
      });
    } catch (stateError) {
      logError('schedule-processor', `Error updating state after fatal error:`, stateError);
    }

    await releaseLock(client, schedule.id, instanceId);
    throw error;
  }
}