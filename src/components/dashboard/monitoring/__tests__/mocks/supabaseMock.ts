import { vi } from 'vitest';
import type { MetricsData } from '../../types/monitoring-types';
import { PostgrestBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js';

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
  class MockPostgrestBuilder extends PostgrestBuilder<any> {
    constructor() {
      super({
        url: new URL('https://mock-url.com'),
        headers: {},
        schema: 'public',
        fetch: vi.fn() as any,
      });
    }

    // Override necessary methods
    throwOnError() {
      return this;
    }
  }

  const mockBuilder = new MockPostgrestBuilder();

  // Add response data
  Object.assign(mockBuilder, {
    data,
    error,
    count: null,
    status: error ? 500 : 200,
    statusText: error ? "Error" : "OK",
    body: data,
  });

  return mockBuilder;
};