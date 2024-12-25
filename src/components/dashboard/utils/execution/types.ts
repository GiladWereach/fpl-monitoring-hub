export interface ExecutionContext {
  scheduleId: string;
  functionName: string;
  attempt: number;
  startTime: Date;
  executionWindow?: {
    start: string;
    end: string;
  };
}

export interface ExecutionDetails {
  error?: string;
  duration?: number;
  metrics?: Record<string, any>;
}