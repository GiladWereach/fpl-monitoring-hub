import { vi } from 'vitest';
import type { MetricsData } from '../../types/monitoring-types';
import { PostgrestBuilder } from '@supabase/postgrest-js';

// Mock data
export const mockMetricsData: MetricsData[] = [{
  endpoint: 'test_endpoint',
  total_successes: 95,
  total_errors: 5,
  avg_response_time: 150,
  success_rate: 95,
  latest_success: '2024-01-01T00:00:00Z',
  latest_error: '2024-01-01T00:00:00Z',
  health_status: 'healthy'
}];

// Create mock response builder
export const createMockSupabaseResponse = (data: any = null, error: any = null) => {
  return {
    data,
    error,
    count: null,
    status: error ? 500 : 200,
    statusText: error ? "Error" : "OK",
    body: data,
    select: () => createMockSupabaseResponse(data, error),
    single: () => createMockSupabaseResponse(data?.[0] || null, error),
    then: (callback: (response: any) => any) => Promise.resolve(callback({ data, error })),
    catch: (callback: (error: any) => any) => Promise.resolve(callback(error)),
  };
};