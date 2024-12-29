import { describe, it, expect, vi } from 'vitest';
import { ResourceManager } from "@/components/backend/scheduler/utils/resourceManager";
import { renderHook } from '@testing-library/react-hooks';
import { useQuery } from '@tanstack/react-query';
import { toast } from "@/hooks/use-toast";

// Mock dependencies
vi.mock("@/components/backend/scheduler/utils/resourceManager", () => ({
  ResourceManager: {
    getInstance: vi.fn(() => ({
      getResourceMetrics: vi.fn()
    }))
  }
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn()
}));

describe('Resource Metrics Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates prediction data correctly', async () => {
    const mockMetrics = {
      predictedUsage: {
        confidence: 0.8,
        anomalyScore: 0.2,
        predictedUsage: 5
      },
      activeTasks: 3,
      requestRate: 10,
      poolStatus: { available: 5, total: 10 }
    };

    const resourceManager = ResourceManager.getInstance();
    vi.mocked(resourceManager.getResourceMetrics).mockReturnValue(mockMetrics);

    const { result } = renderHook(() => useQuery({
      queryKey: ['resource-metrics'],
      queryFn: async () => {
        const functions = ['test-function'];
        return functions.map(fn => ({
          name: fn,
          ...resourceManager.getResourceMetrics(fn)
        }));
      }
    }));

    expect(result.current.data?.[0].predictedUsage.confidence).toBe(0.8);
    expect(result.current.data?.[0].predictedUsage.anomalyScore).toBe(0.2);
  });

  it('handles invalid prediction data', async () => {
    const mockInvalidMetrics = {
      predictedUsage: null,
      activeTasks: 3,
      requestRate: 10
    };

    const resourceManager = ResourceManager.getInstance();
    vi.mocked(resourceManager.getResourceMetrics).mockReturnValue(mockInvalidMetrics);

    const { result } = renderHook(() => useQuery({
      queryKey: ['resource-metrics'],
      queryFn: async () => {
        const functions = ['test-function'];
        return functions.map(fn => ({
          name: fn,
          ...resourceManager.getResourceMetrics(fn)
        }));
      }
    }));

    expect(result.current.error).toBeDefined();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Error Fetching Metrics",
      variant: "destructive"
    }));
  });

  it('calculates pool utilization correctly', async () => {
    const mockMetrics = {
      predictedUsage: { confidence: 0.8, anomalyScore: 0.2, predictedUsage: 5 },
      activeTasks: 3,
      requestRate: 10,
      poolStatus: { available: 3, total: 10 }
    };

    const resourceManager = ResourceManager.getInstance();
    vi.mocked(resourceManager.getResourceMetrics).mockReturnValue(mockMetrics);

    const { result } = renderHook(() => useQuery({
      queryKey: ['resource-metrics'],
      queryFn: async () => {
        const functions = ['test-function'];
        return functions.map(fn => ({
          name: fn,
          ...resourceManager.getResourceMetrics(fn)
        }));
      }
    }));

    const utilization = result.current.data?.[0].poolStatus;
    expect(utilization).toBeDefined();
    expect((utilization?.total - utilization?.available) / utilization?.total * 100).toBe(70);
  });

  it('detects anomalies correctly', async () => {
    const mockMetrics = {
      predictedUsage: { confidence: 0.8, anomalyScore: 2.5, predictedUsage: 5 },
      activeTasks: 3,
      requestRate: 10,
      poolStatus: { available: 5, total: 10 }
    };

    const resourceManager = ResourceManager.getInstance();
    vi.mocked(resourceManager.getResourceMetrics).mockReturnValue(mockMetrics);

    const { result } = renderHook(() => useQuery({
      queryKey: ['resource-metrics'],
      queryFn: async () => {
        const functions = ['test-function'];
        return functions.map(fn => ({
          name: fn,
          ...resourceManager.getResourceMetrics(fn)
        }));
      }
    }));

    expect(result.current.data?.[0].predictedUsage.anomalyScore).toBeGreaterThan(2.0);
  });
});