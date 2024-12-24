import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateSchedule } from '@/services/scheduleValidationService';
import { AdvancedScheduleFormValues } from '../../types/scheduling';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client with complete implementation
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
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

describe('Schedule Validation Service', () => {
  let mockSchedule: AdvancedScheduleFormValues;

  beforeEach(() => {
    // Reset mock schedule before each test
    mockSchedule = {
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
  });

  describe('Basic Validation', () => {
    it('should validate a correct schedule configuration', async () => {
      const result = await validateSchedule(mockSchedule);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate timezone', async () => {
      mockSchedule.timezone = 'Invalid/Timezone';
      const result = await validateSchedule(mockSchedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid timezone configuration');
    });
  });

  describe('Time-based Schedule Validation', () => {
    it('should validate daily schedule hour range', async () => {
      mockSchedule.time_config.hour = 25;
      const result = await validateSchedule(mockSchedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid hour configuration');
    });

    it('should validate interval minutes', async () => {
      mockSchedule.time_config.matchDayIntervalMinutes = -1;
      const result = await validateSchedule(mockSchedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid interval configuration');
    });
  });

  describe('Execution Config Validation', () => {
    it('should validate retry count range', async () => {
      mockSchedule.execution_config.retry_count = -1;
      const result = await validateSchedule(mockSchedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid retry configuration');
    });

    it('should validate timeout range', async () => {
      mockSchedule.execution_config.timeout_seconds = 0;
      const result = await validateSchedule(mockSchedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid timeout configuration');
    });
  });

  describe('Event Conditions Validation', () => {
    it('should validate event conditions structure', async () => {
      mockSchedule.event_conditions = [
        { field: '', operator: 'eq' as const, value: '' }
      ];
      const result = await validateSchedule(mockSchedule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid event conditions configuration');
    });
  });

  describe('Schedule Conflicts', () => {
    it('should detect conflicts with existing schedules', async () => {
      // Mock existing schedule
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ function_name: 'existing-function' }],
            error: null
          }),
          neq: vi.fn(),
          gt: vi.fn(),
          lt: vi.fn(),
          gte: vi.fn(),
          lte: vi.fn(),
        }),
        insert: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        headers: {},
        url: new URL('https://mock-url.com')
      }));

      const result = await validateSchedule(mockSchedule);
      expect(result.warnings).toContain('Schedule may conflict with existing-function');
    });
  });
});