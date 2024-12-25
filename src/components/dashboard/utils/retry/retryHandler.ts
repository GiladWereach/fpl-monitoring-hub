import { toast } from "@/hooks/use-toast";
import { RetryBackoffStrategy } from "../../types/scheduling";
import { calculateBackoff } from "./retryStrategies";
import { logRetryMetrics } from "./retryMonitor";

export interface RetryOptions {
  maxAttempts: number;
  backoffStrategy: RetryBackoffStrategy;
  baseDelay: number;
  timeout: number;
}

interface RetryContext {
  attempt: number;
  startTime: number;
  functionName: string;
}

export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  functionName: string
): Promise<T> => {
  console.log(`Starting execution for ${functionName} with options:`, options);
  
  const retryContext: RetryContext = {
    attempt: 1,
    startTime: Date.now(),
    functionName
  };
  
  try {
    while (retryContext.attempt <= options.maxAttempts) {
      console.log(`Attempt ${retryContext.attempt}/${options.maxAttempts} for ${functionName}`);
      
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
          functionName,
          totalAttempts: retryContext.attempt,
          successfulAttempt: retryContext.attempt,
          totalDuration: duration
        });

        return result;
      } catch (error) {
        console.error(`Attempt ${retryContext.attempt} failed:`, error);

        if (retryContext.attempt === options.maxAttempts) {
          const duration = Date.now() - retryContext.startTime;
          
          // Log failure metrics
          await logRetryMetrics({
            functionName,
            totalAttempts: retryContext.attempt,
            successfulAttempt: null,
            totalDuration: duration,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          toast({
            title: "Operation Failed",
            description: `Failed after ${options.maxAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
  } catch (error) {
    console.error(`Fatal error in retry execution for ${functionName}:`, error);
    throw error;
  }
};