import { describe, it, expect, beforeEach } from 'vitest';
import { validateTimeZone, validateScheduleConflicts, validateExecutionWindow } from '@/utils/validation';
import { AdvancedScheduleFormValues } from '../../types/scheduling';

describe('Schedule Validation Tests', () => {
  let mockScheduleData: AdvancedScheduleFormValues;

  beforeEach(() => {
    // Reset mock data before each test
    mockScheduleData = {
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

  describe('validateTimeZone', () => {
    it('should validate correct timezone', () => {
      expect(validateTimeZone('UTC')).toBe(true);
      expect(validateTimeZone('America/New_York')).toBe(true);
      expect(validateTimeZone('Europe/London')).toBe(true);
    });

    it('should reject invalid timezone', () => {
      expect(validateTimeZone('Invalid/Timezone')).toBe(false);
      expect(validateTimeZone('')).toBe(false);
    });
  });

  describe('validateExecutionWindow', () => {
    it('should validate correct execution window', () => {
      const result = validateExecutionWindow('09:00', '17:00', [1, 2, 3, 4, 5]);
      expect(result).toBe(true);
    });

    it('should reject invalid time format', () => {
      const result = validateExecutionWindow('9:00', '17:00', [1, 2, 3, 4, 5]);
      expect(typeof result).toBe('string');
    });

    it('should reject invalid days', () => {
      const result = validateExecutionWindow('09:00', '17:00', [7, 8]);
      expect(typeof result).toBe('string');
    });
  });

  describe('validateScheduleConflicts', () => {
    it('should detect conflicts for time-based schedules', async () => {
      const result = await validateScheduleConflicts(mockScheduleData);
      expect(result).toBe(true);
    });

    it('should handle event-based schedules', async () => {
      mockScheduleData.schedule_type = 'event_based';
      const result = await validateScheduleConflicts(mockScheduleData);
      expect(result).toBe(true);
    });
  });
});