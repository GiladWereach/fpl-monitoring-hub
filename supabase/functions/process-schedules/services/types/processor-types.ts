import { SupabaseClient } from '@supabase/supabase-js';

export interface ProcessingContext {
  client: SupabaseClient;
  schedule: any;
  instanceId: string;
}

export interface ExecutionResult {
  success: boolean;
  error?: any;
  duration?: number;
  nextExecution?: Date;
}

export interface MatchWindow {
  hasActiveMatches: boolean;
  isMatchDay: boolean;
  nextMatchTime?: Date;
}