import { vi } from 'vitest';
import type { MetricsData } from '../../types/monitoring-types';
import { PostgrestResponse } from '@supabase/postgrest-js';
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

  return {
    data: mockResponse.data,
    error: mockResponse.error,
    count: mockResponse.count,
    status: mockResponse.status,
    statusText: mockResponse.statusText,
    select: () => createMockSupabaseResponse(data, error),
    single: () => createMockSupabaseResponse(data?.[0] || null, error),
    maybeSingle: () => createMockSupabaseResponse(data?.[0] || null, error),
    eq: () => createMockSupabaseResponse(data, error),
    order: () => createMockSupabaseResponse(data, error),
    limit: () => createMockSupabaseResponse(data, error),
    range: () => createMockSupabaseResponse(data, error),
    then: (onfulfilled?: (value: any) => any) => Promise.resolve(onfulfilled ? onfulfilled(mockResponse) : mockResponse),
    catch: (onrejected?: (reason: any) => any) => Promise.resolve(mockResponse)
  };
};