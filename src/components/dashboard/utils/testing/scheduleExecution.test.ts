import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeScheduleTest } from './scheduleTestExecutor';
import { supabase } from '@/integrations/supabase/client';
import { TestResult } from '../../types/scheduling';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        neq: vi.fn(),
        gt: vi.fn(),
        lt: vi.fn(),
        gte: vi.fn(),
        lte: vi.fn(),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      headers: {},
      url: new URL('https://mock-url.com')
    }))
  }
}));

describe('Schedule Execution Integration Tests', () => {
  let mockSchedule: TestResult;

  beforeEach(() => {
    mockSchedule = {
      success: true,
      executionTime: 1000,
      functionName: 'test-function',
      scheduleType: 'time_based',
      retryCount: 0
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Time-based Schedule Execution', () => {
    it('should successfully execute a time-based schedule', async () => {
      const result = await executeScheduleTest('test-function', 'time_based');
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeDefined();
    });

    it('should handle execution failures gracefully', async () => {
      // Mock a failure response
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: null,
        error: new Error('Execution failed')
      });

      const result = await executeScheduleTest('test-function', 'time_based');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Event-based Schedule Execution', () => {
    it('should successfully execute an event-based schedule', async () => {
      const result = await executeScheduleTest('test-function', 'event_based');
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeDefined();
    });

    it('should include event trigger data in execution context', async () => {
      const result = await executeScheduleTest('test-function', 'event_based');
      expect(result.success).toBe(true);
      
      // Verify that the Supabase function was called with event trigger data
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'process-schedules',
        expect.objectContaining({
          body: expect.objectContaining({
            scheduleType: 'event_based',
            eventTrigger: expect.any(Object)
          })
        })
      );
    });
  });

  describe('Retry Mechanism', () => {
    it('should attempt retries on failure', async () => {
      // Mock first attempt failure, second attempt success
      vi.mocked(supabase.functions.invoke)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({ data: null, error: null });

      const result = await executeScheduleTest('test-function', 'time_based');
      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(1);
    });

    it('should respect max retry count', async () => {
      // Mock all attempts failing
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Execution failed'));

      const result = await executeScheduleTest('test-function', 'time_based');
      expect(result.success).toBe(false);
      expect(result.retryCount).toBeLessThanOrEqual(3); // Assuming max retries is 3
    });
  });

  describe('Performance Monitoring', () => {
    it('should track execution time', async () => {
      const result = await executeScheduleTest('test-function', 'time_based');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should log performance metrics', async () => {
      const result = await executeScheduleTest('test-function', 'time_based');
      expect(result.success).toBe(true);
      
      // Verify metrics were logged
      expect(supabase.from).toHaveBeenCalledWith('api_health_metrics');
    });
  });
});