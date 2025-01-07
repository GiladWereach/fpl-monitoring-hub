import { vi } from 'vitest';
import type { MetricsData } from '../../types/monitoring-types';
import { PostgrestBuilder, PostgrestFilterBuilder, PostgrestResponse } from '@supabase/postgrest-js';
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

export const createMockSupabaseResponse = (data: any = null, error: any = null) => {
  const mockResponse: PostgrestResponse<any> = {
    data,
    error,
    count: null,
    status: 200,
    statusText: 'OK'
  };

  const mockBuilder = {
    select: () => mockBuilder,
    single: () => mockBuilder,
    maybeSingle: () => mockBuilder,
    eq: () => mockBuilder,
    order: () => mockBuilder,
    limit: () => mockBuilder,
    range: () => mockBuilder,
    then: async () => mockResponse,
    catch: async () => mockResponse,
  };

  return mockBuilder as unknown as PostgrestFilterBuilder<Database['public'], any, any>;
};