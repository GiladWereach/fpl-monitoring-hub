import { toast } from "@/hooks/use-toast";
import { calculateBackoffDelay } from './retryStrategies';
import { RetryBackoffStrategy } from '../../types/scheduling';

export interface RetryOptions {
  maxAttempts: number;
  backoffStrategy: RetryBackoffStrategy;
  baseDelay: number;
  timeout: number;
}

export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  context: string
): Promise<T> => {
  let attempt = 1;
  
  while (attempt <= options.maxAttempts) {
    try {
      console.log(`Attempt ${attempt}/${options.maxAttempts} for ${context}`);
      
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), options.timeout)
        )
      ]);

      console.log(`Operation succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt === options.maxAttempts) {
        toast({
          title: "Operation Failed",
          description: `Failed after ${options.maxAttempts} attempts: ${error.message}`,
          variant: "destructive",
        });
        throw error;
      }

      const delay = calculateBackoffDelay(
        attempt,
        options.backoffStrategy,
        options.baseDelay
      );

      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw new Error('Retry loop completed without success');
};