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
      url: 'http://mock.url',
      headers: {},
      schema: 'public',
      fetch: vi.fn(),
      shouldThrowOnError: false
    });
    
    this.mockData = data;
    this.mockError = error;
  }

  then(callback: (response: any) => any): Promise<any> {
    return Promise.resolve(callback({ data: this.mockData, error: this.mockError }));
  }

  catch(callback: (error: any) => any): Promise<any> {
    return Promise.resolve(callback(this.mockError));
  }

  select(): this {
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
  const mockBuilder = new MockPostgrestBuilder<Database>(data, error);

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

  // Add additional required methods
  (mockBuilder as any).order = vi.fn().mockReturnThis();
  (mockBuilder as any).limit = vi.fn().mockReturnThis();
  (mockBuilder as any).range = vi.fn().mockReturnThis();
  (mockBuilder as any).csv = vi.fn().mockReturnThis();
  (mockBuilder as any).geojson = vi.fn().mockReturnThis();
  (mockBuilder as any).explain = vi.fn().mockReturnThis();
  (mockBuilder as any).rollback = vi.fn().mockReturnThis();
  (mockBuilder as any).returns = vi.fn().mockReturnThis();

  return mockBuilder as unknown as PostgrestFilterBuilder<Database['public'], any, any>;
};