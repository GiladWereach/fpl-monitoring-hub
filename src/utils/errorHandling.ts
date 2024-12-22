import { toast } from "@/hooks/use-toast";

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorDetails {
  code: string;
  message: string;
  severity: ErrorSeverity;
  retryable: boolean;
  context?: Record<string, unknown>;
}

export class SchedulerError extends Error {
  public readonly details: ErrorDetails;
  
  constructor(details: ErrorDetails) {
    super(details.message);
    this.details = details;
    this.name = 'SchedulerError';
  }
}

export const errorClassification = {
  RATE_LIMIT_ERROR: {
    code: 'RATE_LIMIT_ERROR',
    message: 'Rate limit exceeded',
    severity: 'high' as ErrorSeverity,
    retryable: true
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
    severity: 'high' as ErrorSeverity,
    retryable: true
  },
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    message: 'Operation timed out',
    severity: 'medium' as ErrorSeverity,
    retryable: true
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Data validation failed',
    severity: 'low' as ErrorSeverity,
    retryable: false
  },
  CONCURRENCY_ERROR: {
    code: 'CONCURRENCY_ERROR',
    message: 'Concurrent execution conflict',
    severity: 'medium' as ErrorSeverity,
    retryable: true
  },
  RESOURCE_ERROR: {
    code: 'RESOURCE_ERROR',
    message: 'Resource unavailable',
    severity: 'high' as ErrorSeverity,
    retryable: true
  }
};

export const calculateBackoff = (attempt: number, strategy: 'linear' | 'exponential' | 'fixed', baseDelay: number = 1000): number => {
  console.log(`Calculating backoff for attempt ${attempt} using ${strategy} strategy`);
  
  switch (strategy) {
    case 'exponential':
      return Math.min(Math.pow(2, attempt) * baseDelay, 300000); // Max 5 minutes
    case 'linear':
      return Math.min(attempt * baseDelay, 300000);
    case 'fixed':
      return baseDelay;
    default:
      return baseDelay;
  }
};

export const handleSchedulerError = async (
  error: unknown,
  context: { functionName: string; attempt: number; maxAttempts: number }
): Promise<void> => {
  console.error(`Error in scheduler for ${context.functionName}:`, error);

  let schedulerError: SchedulerError;
  
  if (error instanceof SchedulerError) {
    schedulerError = error;
  } else if (error instanceof Error) {
    // Classify generic errors
    if (error.message.includes('timeout')) {
      schedulerError = new SchedulerError({
        ...errorClassification.TIMEOUT_ERROR,
        context: { originalError: error.message }
      });
    } else if (error.message.includes('network')) {
      schedulerError = new SchedulerError({
        ...errorClassification.NETWORK_ERROR,
        context: { originalError: error.message }
      });
    } else {
      schedulerError = new SchedulerError({
        code: 'UNKNOWN_ERROR',
        message: error.message,
        severity: 'medium',
        retryable: true,
        context: { originalError: error.message }
      });
    }
  } else {
    schedulerError = new SchedulerError({
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      severity: 'medium',
      retryable: true,
      context: { originalError: String(error) }
    });
  }

  // Log error details
  console.error('Classified error:', {
    code: schedulerError.details.code,
    severity: schedulerError.details.severity,
    retryable: schedulerError.details.retryable,
    attempt: context.attempt,
    maxAttempts: context.maxAttempts
  });

  // Show user-friendly toast
  toast({
    title: `Error in ${context.functionName}`,
    description: schedulerError.details.message,
    variant: "destructive",
  });

  // Throw if max attempts reached or not retryable
  if (context.attempt >= context.maxAttempts || !schedulerError.details.retryable) {
    throw schedulerError;
  }
};

export const cleanupResources = async (functionName: string): Promise<void> => {
  console.log(`Cleaning up resources for ${functionName}`);
  
  try {
    // Remove any temporary files or data
    await Promise.all([
      cleanupTempFiles(functionName),
      cleanupStaleConnections(functionName),
      cleanupOrphanedProcesses(functionName)
    ]);
  } catch (error) {
    console.error(`Error during cleanup for ${functionName}:`, error);
    // Don't throw here - cleanup errors shouldn't block execution
  }
};

const cleanupTempFiles = async (functionName: string): Promise<void> => {
  console.log(`Cleaning up temporary files for ${functionName}`);
  // Implementation would depend on what temporary files your system creates
};

const cleanupStaleConnections = async (functionName: string): Promise<void> => {
  console.log(`Cleaning up stale connections for ${functionName}`);
  // Implementation would close any hanging connections
};

const cleanupOrphanedProcesses = async (functionName: string): Promise<void> => {
  console.log(`Cleaning up orphaned processes for ${functionName}`);
  // Implementation would handle any orphaned processes
};