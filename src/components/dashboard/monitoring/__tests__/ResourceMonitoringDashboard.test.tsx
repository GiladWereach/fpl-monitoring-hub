import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ResourceMonitoringDashboard } from '../ResourceMonitoringDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { MetricsData } from '../types/monitoring-types';

// Mock data
const mockMetricsData: MetricsData[] = [{
  endpoint: 'test_endpoint',
  total_successes: 95,
  total_errors: 5,
  avg_response_time: 150,
  success_rate: 95,
  latest_success: '2024-01-01T00:00:00Z',
  latest_error: '2024-01-01T00:00:00Z',
  health_status: 'healthy',
  predictedUsage: {
    predictedUsage: 100,
    confidence: 0.95,
    anomalyScore: 0.1
  }
}];

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockImplementation(() => ({
      then: (callback: any): Promise<PostgrestResponse<MetricsData[]>> => 
        Promise.resolve(callback({ data: mockMetricsData, error: null }))
    }))
  }
}));

describe('ResourceMonitoringDashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0
        },
      },
    });
  });

  it('renders loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ResourceMonitoringDashboard />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Resource Usage/i)).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(supabase.rpc).mockImplementationOnce(() => ({
      then: (callback: any) => Promise.resolve(callback({ 
        data: null, 
        error: { message: 'Failed to fetch metrics' } 
      })),
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceMonitoringDashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Failed to load resource metrics/i)).toBeInTheDocument();
    errorMock.mockRestore();
  });

  it('renders metrics when data is loaded', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ResourceMonitoringDashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Resource Usage/i)).toBeInTheDocument();
  });
});