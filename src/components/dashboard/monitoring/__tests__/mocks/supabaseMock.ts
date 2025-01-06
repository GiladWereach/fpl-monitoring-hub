import { vi } from 'vitest';
import type { MetricsData } from '../../types/monitoring-types';

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
  const mockBuilder = {
    data,
    error,
    count: null,
    status: error ? 500 : 200,
    statusText: error ? "Error" : "OK",
    body: data,
    // Basic filter methods
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    // Additional filter methods
    likeAllOf: vi.fn().mockReturnThis(),
    likeAnyOf: vi.fn().mockReturnThis(),
    ilikeAllOf: vi.fn().mockReturnThis(),
    ilikeAnyOf: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    withinRange: vi.fn().mockReturnThis(),
    containsAllOf: vi.fn().mockReturnThis(),
    containsAnyOf: vi.fn().mockReturnThis(),
    containedByAnyOf: vi.fn().mockReturnThis(),
    containedByAllOf: vi.fn().mockReturnThis(),
    matchAllOf: vi.fn().mockReturnThis(),
    matchAnyOf: vi.fn().mockReturnThis(),
    notAllOf: vi.fn().mockReturnThis(),
    notAnyOf: vi.fn().mockReturnThis(),
    orAllOf: vi.fn().mockReturnThis(),
    orAnyOf: vi.fn().mockReturnThis(),
    filterAllOf: vi.fn().mockReturnThis(),
    filterAnyOf: vi.fn().mockReturnThis(),
    // Query methods
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    csv: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    // Response methods
    select: () => mockBuilder,
    then: (callback: (response: any) => any) => Promise.resolve(callback({ data, error })),
    catch: (callback: (error: any) => any) => Promise.resolve(callback(error)),
    throwOnError: () => mockBuilder,
  };

  return mockBuilder;
};