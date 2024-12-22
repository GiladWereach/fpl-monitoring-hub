export type BackoffStrategy = 'linear' | 'exponential' | 'fixed';

export function calculateBackoff(
  attempt: number,
  strategy: BackoffStrategy = 'linear',
  baseDelay: number = 1000,
  maxDelay: number = 300000 // 5 minutes
): number {
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

  // Add some jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.floor(delay + jitter);
}