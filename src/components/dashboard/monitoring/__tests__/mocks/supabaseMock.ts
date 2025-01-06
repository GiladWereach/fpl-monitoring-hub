import { vi } from 'vitest';
import type { MetricsData } from '../../types/monitoring-types';
import { PostgrestBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { Database } from '@/integrations/supabase/types';

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

class MockPostgrestBuilder<T> extends PostgrestBuilder<T> {
  private mockData: any;
  private mockError: any;

  constructor(data: any = null, error: any = null) {
    super({
      url: new URL('http://mock.url'),
      headers: {},
      schema: 'public',
      fetch: vi.fn(),
      shouldThrowOnError: false,
      signal: undefined
    });
    
    this.mockData = data;
    this.mockError = error;
  }

  async then<TResult1 = any>(
    onfulfilled?: ((value: { data: T | null; error: any }) => TResult1 | PromiseLike<TResult1>)
  ): Promise<TResult1> {
    const result = { data: this.mockData, error: this.mockError };
    return onfulfilled ? onfulfilled(result) : result as any;
  }

  throwOnError(): this {
    return this;
  }

  select(columns?: string): this {
    return this;
  }

  order(): this {
    return this;
  }

  limit(): this {
    return this;
  }

  range(): this {
    return this;
  }

  single(): this {
    return this;
  }

  maybeSingle(): this {
    return this;
  }
}

// Create mock response builder
export const createMockSupabaseResponse = (data: any = null, error: any = null) => {
  const mockBuilder = new MockPostgrestBuilder(data, error);

  // Add all the required filter methods
  const filterMethods = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'contains', 'containedBy', 'rangeLt', 'rangeGt',
    'rangeGte', 'rangeLte', 'rangeAdjacent', 'overlaps', 'match',
    'not', 'or', 'filter'
  ];

  filterMethods.forEach(method => {
    (mockBuilder as any)[method] = vi.fn().mockReturnThis();
  });

  return mockBuilder as unknown as PostgrestFilterBuilder<Database['public'], any, any>;
};