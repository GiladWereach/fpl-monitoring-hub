import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logDebug, logError } from '../../shared/logging-service.ts';

export async function executeInTransaction<T>(
  supabaseClient: ReturnType<typeof createClient>,
  operation: (client: ReturnType<typeof createClient>) => Promise<T>,
  context: string
): Promise<T> {
  const transactionId = crypto.randomUUID();
  logDebug('transaction-service', `Starting transaction ${transactionId} for operation: ${context}`);
  
  try {
    // Begin transaction
    await supabaseClient.rpc('begin_transaction');
    logDebug('transaction-service', `Transaction ${transactionId} started for ${context}`);

    // Execute the operation
    const result = await operation(supabaseClient);

    // Commit transaction
    await supabaseClient.rpc('commit_transaction');
    logDebug('transaction-service', `Transaction ${transactionId} committed for ${context}`);

    return result;
  } catch (error) {
    // Rollback on error
    await supabaseClient.rpc('rollback_transaction');
    logError('transaction-service', `Transaction ${transactionId} rolled back for ${context}:`, error);
    throw error;
  }
}

export async function cleanupOldData(supabaseClient: ReturnType<typeof createClient>) {
  logDebug('cleanup-service', 'Starting cleanup of old data');
  
  try {
    // Clean up old execution logs (keep last 7 days)
    const { error: logsError } = await supabaseClient
      .from('schedule_execution_logs')
      .delete()
      .lt('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (logsError) throw logsError;

    // Clean up expired locks
    const { error: locksError } = await supabaseClient
      .from('schedule_locks')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (locksError) throw locksError;

    // Clean up old metrics (keep last 30 days)
    const { error: metricsError } = await supabaseClient
      .from('api_health_metrics')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (metricsError) throw metricsError;

    logDebug('cleanup-service', 'Cleanup completed successfully');
  } catch (error) {
    logError('cleanup-service', 'Error during cleanup:', error);
    throw error;
  }
}
