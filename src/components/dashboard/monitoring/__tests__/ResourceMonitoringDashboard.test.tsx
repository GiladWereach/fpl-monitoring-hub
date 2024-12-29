import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ResourceMonitoringDashboard } from '../ResourceMonitoringDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import type { Database } from '@/integrations/supabase/types';

// Mock data
const mockData = {
  success_rate: 95,
  avg_response_time: 150,
  error_rate: 5,
  system_load: 75,
};

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((callback) => 
        Promise.resolve(callback({ data: mockData, error: null }))
      ),
      url: 'mock-url',
      headers: {},
      insert: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as PostgrestQueryBuilder<Database['public'], any, any>)),
    rpc: vi.fn().mockImplementation(() => ({
      single: () => Promise.resolve({ data: mockData, error: null }),
    })),
  },
}));

describe('ResourceMonitoringDashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
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
    expect(screen.getByText(/Loading metrics/i)).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(supabase.from).mockImplementationOnce((table: string) => ({
      ...vi.mocked(supabase.from)(table),
      then: vi.fn().mockImplementation((callback) => 
        Promise.resolve(callback({ data: null, error: { message: 'Failed to fetch metrics' } }))
      ),
    } as unknown as PostgrestQueryBuilder<Database['public'], any, any>));

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
    expect(await screen.findByText(/95%/)).toBeInTheDocument();
    expect(await screen.findByText(/150ms/)).toBeInTheDocument();
  });
});