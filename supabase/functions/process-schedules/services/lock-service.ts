import { SupabaseClient } from '@supabase/supabase-js';
import { logDebug, logError } from '../../../shared/logging-service';

export async function acquireLock(
  client: SupabaseClient,
  scheduleId: string,
  instanceId: string,
  timeoutSeconds: number
): Promise<boolean> {
  try {
    const { data: lockAcquired, error: lockError } = await client
      .rpc('acquire_schedule_lock', {
        p_schedule_id: scheduleId,
        p_locked_by: instanceId,
        p_lock_duration_seconds: timeoutSeconds
      });

    if (lockError) throw lockError;
    
    if (lockAcquired) {
      logDebug('lock-service', `Lock acquired for schedule ${scheduleId}`);
    } else {
      logDebug('lock-service', `Could not acquire lock for schedule ${scheduleId}`);
    }

    return lockAcquired;
  } catch (error) {
    logError('lock-service', `Error acquiring lock for ${scheduleId}:`, error);
    throw error;
  }
}

export async function releaseLock(
  client: SupabaseClient,
  scheduleId: string,
  instanceId: string
): Promise<void> {
  try {
    const { error } = await client
      .rpc('release_schedule_lock', {
        p_schedule_id: scheduleId,
        p_locked_by: instanceId
      });

    if (error) throw error;
    logDebug('lock-service', `Lock released for schedule ${scheduleId}`);
  } catch (error) {
    logError('lock-service', `Error releasing lock for ${scheduleId}:`, error);
    throw error;
  }
}