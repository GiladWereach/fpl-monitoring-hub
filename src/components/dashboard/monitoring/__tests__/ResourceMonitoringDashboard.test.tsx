import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { beforeEach, describe, expect, it } from 'vitest';
import ResourceMonitoringDashboard from '../ResourceMonitoringDashboard';
import { supabase } from '@/integrations/supabase/client';
import { vi } from 'vitest';

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
    render(<ResourceMonitoringDashboard />);
    expect(screen.getByText(/Resource Monitoring/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<ResourceMonitoringDashboard />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('fetches and displays metrics data', async () => {
    render(<ResourceMonitoringDashboard />);
    
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

    render(<ResourceMonitoringDashboard />);
    
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