import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError, logInfo } from '../shared/logging-service.ts';
import { detectMatchWindow } from './match-window-service.ts';
import { transitionState, getCurrentState } from './state-management-service.ts';

export interface ProcessingContext {
  client: SupabaseClient;
  schedule: any;
  instanceId: string;
}

export interface ExecutionResult {
  success: boolean;
  error?: any;
  duration?: number;
  nextExecution?: Date;
}

export async function processSchedule(
  context: ProcessingContext
): Promise<ExecutionResult> {
  const startTime = Date.now();
  logInfo('processor-service', `Processing schedule: ${context.schedule.function_name}`, {
    scheduleId: context.schedule.id,
    instanceId: context.instanceId
  });

  try {
    // Check current state
    const currentState = await getCurrentState(context.client, context.schedule.id);
    
    // Only process schedules in valid states
    if (!['idle', 'scheduled'].includes(currentState)) {
      logDebug('processor-service', `Skipping schedule ${context.schedule.id} in state ${currentState}`);
      return { success: false };
    }

    // Check match window for match-dependent schedules
    if (context.schedule.schedule_type === 'match_dependent') {
      const matchWindow = await detectMatchWindow(context.client);
      logInfo('processor-service', `Match window status for ${context.schedule.function_name}:`, {
        type: matchWindow.type,
        hasActiveMatches: matchWindow.hasActiveMatches
      });
    }

    // Transition to pending
    await transitionState(context.client, {
      schedule_id: context.schedule.id,
      from_state: currentState,
      to_state: 'pending',
      metadata: {
        instance_id: context.instanceId,
        started_at: new Date().toISOString()
      }
    });

    // Execute the function
    const { error: invokeError } = await context.client.functions.invoke(
      context.schedule.function_name,
      {
        body: {
          scheduled: true,
          context: {
            schedule_id: context.schedule.id,
            instance_id: context.instanceId
          }
        }
      }
    );

    if (invokeError) throw invokeError;

    const executionTime = Date.now() - startTime;

    // Transition to completed
    await transitionState(context.client, {
      schedule_id: context.schedule.id,
      from_state: 'pending',
      to_state: 'completed',
      metadata: {
        execution_duration_ms: executionTime
      }
    });

    return {
      success: true,
      duration: executionTime
    };

  } catch (error) {
    logError('processor-service', `Error processing schedule ${context.schedule.id}:`, error);
    
    await transitionState(context.client, {
      schedule_id: context.schedule.id,
      from_state: 'pending',
      to_state: 'failed',
      metadata: {
        error: error.message,
        error_time: new Date().toISOString()
      }
    });

    return {
      success: false,
      error,
      duration: Date.now() - startTime
    };
  }
}