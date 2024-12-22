import { RetryBackoffStrategy } from '../../types/scheduling';

export const calculateBackoffDelay = (
  attempt: number,
  strategy: RetryBackoffStrategy,
  baseDelay: number = 1000,
  maxDelay: number = 300000 // 5 minutes
): number => {
  console.log(`Calculating backoff delay for attempt ${attempt} using ${strategy} strategy`);
  
  let delay: number;
  switch (strategy) {
    case 'exponential':
      delay = Math.min(Math.pow(2, attempt) * baseDelay, maxDelay);
      break;
    case 'linear':
      delay = Math.min(attempt * baseDelay, maxDelay);
      break;
    case 'fixed':
    default:
      delay = baseDelay;
  }

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.floor(delay + jitter);
};

export const validateRetryConfig = (
  retryCount: number,
  timeout: number,
  backoffStrategy: RetryBackoffStrategy
): boolean => {
  console.log('Validating retry configuration:', { retryCount, timeout, backoffStrategy });
  
  if (retryCount < 0 || retryCount > 10) {
    console.error('Invalid retry count. Must be between 0 and 10');
    return false;
  }

  if (timeout < 1000 || timeout > 300000) {
    console.error('Invalid timeout. Must be between 1 and 300 seconds');
    return false;
  }

  if (!['linear', 'exponential', 'fixed'].includes(backoffStrategy)) {
    console.error('Invalid backoff strategy');
    return false;
  }

  return true;
};