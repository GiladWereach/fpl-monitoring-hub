import { toast } from "@/hooks/use-toast";
import { calculateBackoff } from './retryStrategies';
import { RetryBackoffStrategy } from '../../types/scheduling';
import { logRetryMetrics } from './retryMonitor';

export interface RetryOptions {
  maxAttempts: number;
  backoffStrategy: RetryBackoffStrategy;
  baseDelay: number;
  timeout: number;
  concurrentExecutions?: number;
}

interface RetryContext {
  attempt: number;
  startTime: number;
  context: string;
}

const activeConcurrentExecutions = new Map<string, number>();

export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  context: string
): Promise<T> => {
  console.log(`Starting execution for ${context} with options:`, options);
  
  // Check concurrent executions
  const currentConcurrent = activeConcurrentExecutions.get(context) || 0;
  if (options.concurrentExecutions && currentConcurrent >= options.concurrentExecutions) {
    console.log(`Max concurrent executions (${options.concurrentExecutions}) reached for ${context}`);
    throw new Error('Max concurrent executions reached');
  }

  // Increment concurrent executions counter
  activeConcurrentExecutions.set(context, currentConcurrent + 1);
  
  const retryContext: RetryContext = {
    attempt: 1,
    startTime: Date.now(),
    context
  };
  
  try {
    while (retryContext.attempt <= options.maxAttempts) {
      console.log(`Attempt ${retryContext.attempt}/${options.maxAttempts} for ${context}`);
      
      try {
        const result = await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), options.timeout)
          )
        ]) as T;

        const duration = Date.now() - retryContext.startTime;
        console.log(`Operation succeeded on attempt ${retryContext.attempt} after ${duration}ms`);
        
        // Log success metrics
        await logRetryMetrics({
          functionName: context,
          totalAttempts: retryContext.attempt,
          successfulAttempt: retryContext.attempt,
          totalDuration: duration
        });

        return result;
      } catch (error) {
        console.error(`Attempt ${retryContext.attempt} failed:`, error);

        if (retryContext.attempt === options.maxAttempts) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          const duration = Date.now() - retryContext.startTime;
          
          // Log failure metrics
          await logRetryMetrics({
            functionName: context,
            totalAttempts: retryContext.attempt,
            successfulAttempt: null,
            totalDuration: duration,
            error: errorMessage
          });

          toast({
            title: "Operation Failed",
            description: `Failed after ${options.maxAttempts} attempts: ${errorMessage}`,
            variant: "destructive",
          });
          throw error;
        }

        const delay = calculateBackoff(
          retryContext.attempt,
          options.backoffStrategy,
          options.baseDelay
        );

        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retryContext.attempt++;
      }
    }

    throw new Error('Retry loop completed without success');
  } finally {
    // Decrement concurrent executions counter
    const currentCount = activeConcurrentExecutions.get(context) || 1;
    if (currentCount <= 1) {
      activeConcurrentExecutions.delete(context);
    } else {
      activeConcurrentExecutions.set(context, currentCount - 1);
    }
  }
};