import { ResourceManager } from './resourceManager';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  matchWindow?: {
    isActive: boolean;
    nextKickoff?: Date | null;
  };
}

export const calculateBackoffDelay = (
  attempt: number,
  { baseDelay, maxDelay, matchWindow }: RetryConfig
): number => {
  console.log(`Calculating backoff delay for attempt ${attempt}`, { matchWindow });
  
  // Adjust delay based on match window
  if (matchWindow?.isActive) {
    console.log('Active match window - using shorter delays');
    baseDelay = Math.min(baseDelay, 30000); // Max 30s during matches
    maxDelay = Math.min(maxDelay, 60000);  // Max 1min during matches
  } else if (matchWindow?.nextKickoff) {
    const timeToKickoff = matchWindow.nextKickoff.getTime() - Date.now();
    if (timeToKickoff <= 3600000) { // Within 1 hour of kickoff
      console.log('Approaching kickoff - using medium delays');
      baseDelay = Math.min(baseDelay, 60000); // Max 1min near kickoff
      maxDelay = Math.min(maxDelay, 120000); // Max 2min near kickoff
    }
  }
  
  const delay = Math.min(
    Math.pow(2, attempt) * baseDelay,
    maxDelay
  );
  
  console.log(`Calculated delay: ${delay}ms`);
  return delay;
};

export const sleep = async (ms: number): Promise<void> => {
  console.log(`Sleeping for ${ms}ms`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const executeWithRetry = async <T>(
  functionName: string,
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> => {
  const resourceManager = ResourceManager.getInstance();
  let attempt = 0;

  while (attempt <= config.maxRetries) {
    try {
      // Check resource limits before executing
      const canExecute = await resourceManager.canExecute(functionName);
      if (!canExecute) {
        console.log(`Resource limits reached for ${functionName}, waiting before retry`);
        await sleep(calculateBackoffDelay(attempt, config));
        continue;
      }

      // Track execution
      await resourceManager.trackExecution(functionName);
      
      // Execute operation
      const result = await operation();
      
      // Release resources
      await resourceManager.releaseExecution(functionName);
      
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed for ${functionName}:`, error);
      
      // Release resources on error
      await resourceManager.releaseExecution(functionName);
      
      if (attempt === config.maxRetries) {
        throw error;
      }
      
      attempt++;
      await sleep(calculateBackoffDelay(attempt, config));
    }
  }

  throw new Error(`All retry attempts failed for ${functionName}`);
};