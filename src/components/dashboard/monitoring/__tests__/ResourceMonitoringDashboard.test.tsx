import { render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { vi } from 'vitest';
import { ResourceMonitoringDashboard } from '../ResourceMonitoringDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      url: 'mock-url',
      headers: {},
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((callback) => 
        Promise.resolve(callback({ data: mockData, error: null }))
      ),
    }),
    rpc: vi.fn().mockImplementation(() => ({
      single: () => Promise.resolve({ data: mockData, error: null }),
    })),
  },
}));

// Mock data
const mockData = {
  success_rate: 95,
  avg_response_time: 150,
  error_rate: 5,
  system_load: 75,
};

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
    vi.mocked(supabase.from).mockImplementation(() => ({
      ...vi.mocked(supabase.from)(),
      then: vi.fn().mockImplementation((callback) => 
        Promise.resolve(callback({ data: null, error: { message: 'Failed to fetch metrics' } }))
      ),
    }));

    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ResourceMonitoringDashboard />
        </QueryClientProvider>
      );
    });

    expect(screen.getByText(/Failed to load resource metrics/i)).toBeInTheDocument();
    errorMock.mockRestore();
  });

  it('renders metrics when data is loaded', async () => {
    await act(async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ResourceMonitoringDashboard />
        </QueryClientProvider>
      );
    });

    expect(screen.getByText(/Resource Usage/i)).toBeInTheDocument();
    expect(screen.getByText(/95%/)).toBeInTheDocument();
    expect(screen.getByText(/150ms/)).toBeInTheDocument();
  });
});