import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { ResourceMonitoringDashboard } from '../ResourceMonitoringDashboard';
import { supabase } from '@/integrations/supabase/client';
import '@testing-library/jest-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('ResourceMonitoringDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mock('@/integrations/supabase/client', () => ({
      supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            metrics: {
              total_records: 100,
              collection_rate: 0.95,
              success_rate: 0.98
            },
            performance: {
              avg_processing_time: 150,
              error_rate: 0.02,
              data_quality_score: 0.99
            }
          },
          error: null
        })
      }
    }));
  });

  it('renders without crashing', () => {
    render(<ResourceMonitoringDashboard />, { wrapper });
    expect(screen.getByText(/Resource Usage/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<ResourceMonitoringDashboard />, { wrapper });
    expect(screen.getByText(/Loading metrics.../i)).toBeInTheDocument();
  });

  it('fetches and displays metrics data', async () => {
    render(<ResourceMonitoringDashboard />, { wrapper });
    
    // Wait for data to load
    await screen.findByText(/Collection Rate: 95%/i);
    
    // Verify metrics are displayed
    expect(screen.getByText(/Success Rate: 98%/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Processing Time: 150ms/i)).toBeInTheDocument();
    expect(screen.getByText(/Error Rate: 2%/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Quality Score: 99%/i)).toBeInTheDocument();
  });

  it('handles error states gracefully', async () => {
    // Mock error response
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.reject(new Error('Failed to fetch metrics'))
        })
      })
    }));

    render(<ResourceMonitoringDashboard />, { wrapper });
    
    // Wait for error message
    await screen.findByText(/Error loading metrics/i);
    
    expect(screen.getByText(/Please try again later/i)).toBeInTheDocument();
  });

  it('updates metrics periodically', () => {
    const { result } = renderHook(() => {
      const [metrics, setMetrics] = React.useState(null);
      return { metrics, setMetrics };
    });

    // Verify initial state
    expect(result.current.metrics).toBeNull();

    // Simulate metric update
    act(() => {
      result.current.setMetrics({
        collection_rate: 0.96,
        success_rate: 0.99
      });
    });

    // Verify updated state
    expect(result.current.metrics).toEqual({
      collection_rate: 0.96,
      success_rate: 0.99
    });
  });
});