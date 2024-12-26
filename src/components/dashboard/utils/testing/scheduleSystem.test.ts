import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { executeScheduleTest } from './scheduleTestExecutor';
import { validateSchedule } from '@/services/scheduleValidationService';
import { AdvancedScheduleFormValues } from '../../types/scheduling';

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

describe('Schedule System End-to-End Tests', () => {
  let testSchedule: AdvancedScheduleFormValues;

  beforeAll(() => {
    testSchedule = {
      function_name: 'test-function',
      enabled: true,
      schedule_type: 'time_based',
      timezone: 'UTC',
      time_config: {
        type: 'daily',
        hour: 3,
        matchDayIntervalMinutes: 2,
        nonMatchIntervalMinutes: 30
      },
      event_config: {
        triggerType: 'deadline',
        offsetMinutes: 0
      },
      execution_config: {
        retry_count: 3,
        timeout_seconds: 30,
        retry_delay_seconds: 60,
        concurrent_execution: false,
        retry_backoff: 'linear',
        max_retry_delay: 3600
      },
      event_conditions: []
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Schedule Creation and Validation', () => {
    it('should validate and create a new schedule', async () => {
      const validationResult = await validateSchedule(testSchedule);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should detect invalid configurations', async () => {
      const invalidSchedule = { ...testSchedule, timezone: 'Invalid/Timezone' };
      const validationResult = await validateSchedule(invalidSchedule);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('Invalid timezone configuration');
    });
  });

  describe('Schedule Execution Flow', () => {
    it('should execute a complete schedule lifecycle', async () => {
      // 1. Validate schedule
      const validationResult = await validateSchedule(testSchedule);
      expect(validationResult.isValid).toBe(true);

      // 2. Execute schedule
      const executionResult = await executeScheduleTest(
        testSchedule.function_name,
        testSchedule.schedule_type
      );
      expect(executionResult.success).toBe(true);
      expect(executionResult.executionTime).toBeDefined();

      // 3. Verify metrics were logged
      expect(supabase.from).toHaveBeenCalledWith('api_health_metrics');
    });

    it('should handle the complete error recovery flow', async () => {
      // 1. Mock initial failure
      vi.mocked(supabase.functions.invoke)
        .mockRejectedValueOnce(new Error('Initial failure'))
        .mockResolvedValueOnce({ data: null, error: null });

      // 2. Execute and verify retry behavior
      const executionResult = await executeScheduleTest(
        testSchedule.function_name,
        testSchedule.schedule_type
      );

      expect(executionResult.success).toBe(true);
      expect(executionResult.retryCount).toBeGreaterThan(0);
      expect(executionResult.retryCount).toBeLessThanOrEqual(testSchedule.execution_config.retry_count);
    });
  });

  describe('System Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // 1. Create and validate schedule
      const validationResult = await validateSchedule(testSchedule);
      expect(validationResult.isValid).toBe(true);

      // 2. Execute schedule
      const executionResult = await executeScheduleTest(
        testSchedule.function_name,
        testSchedule.schedule_type
      );
      expect(executionResult.success).toBe(true);

      // 3. Verify execution logs
      expect(supabase.from).toHaveBeenCalledWith('schedule_execution_logs');
      
      // 4. Verify metrics
      expect(supabase.from).toHaveBeenCalledWith('api_health_metrics');
    });
  });
});