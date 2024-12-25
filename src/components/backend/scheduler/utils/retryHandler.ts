export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export const calculateBackoffDelay = (
  attempt: number,
  { baseDelay, maxDelay }: RetryConfig
): number => {
  console.log(`Calculating backoff delay for attempt ${attempt}`);
  
  const delay = Math.min(
    Math.pow(2, attempt) * baseDelay,
    maxDelay
  );
  
  console.log(`Calculated delay: ${delay}ms`);
  return delay;
};

export const sleep = (ms: number): Promise<void> => {
  console.log(`Sleeping for ${ms}ms`);
  return new Promise(resolve => setTimeout(resolve, ms));
};