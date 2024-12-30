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
    protected method: 'GET' | 'HEAD' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
    protected shouldThrowOnError = false;
    protected isMaybeSingle = false;
    protected headers: { [key: string]: string } = {};

    constructor() {
      super({} as any);
      this.url = new URL('https://mock-url.com');
      this.schema = 'public';
      this.fetch = vi.fn() as any;
    }

    // Required filter methods
    eq = vi.fn().mockReturnThis();
    neq = vi.fn().mockReturnThis();
    gt = vi.fn().mockReturnThis();
    gte = vi.fn().mockReturnThis();
    lt = vi.fn().mockReturnThis();
    lte = vi.fn().mockReturnThis();
    like = vi.fn().mockReturnThis();
    ilike = vi.fn().mockReturnThis();
    is = vi.fn().mockReturnThis();
    in = vi.fn().mockReturnThis();
    contains = vi.fn().mockReturnThis();
    containedBy = vi.fn().mockReturnThis();
    rangeLt = vi.fn().mockReturnThis();
    rangeGt = vi.fn().mockReturnThis();
    rangeGte = vi.fn().mockReturnThis();
    rangeLte = vi.fn().mockReturnThis();
    rangeAdjacent = vi.fn().mockReturnThis();
    overlaps = vi.fn().mockReturnThis();
    match = vi.fn().mockReturnThis();
    not = vi.fn().mockReturnThis();
    or = vi.fn().mockReturnThis();
    filter = vi.fn().mockReturnThis();

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

  return mockBuilder as unknown as PostgrestFilterBuilder<any, any, any>;
};