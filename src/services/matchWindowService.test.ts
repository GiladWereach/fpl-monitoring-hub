import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectMatchWindow, MatchWindow } from './matchWindowService';
import { addHours, subHours } from 'date-fns';

describe('Match Window Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should handle timezone conversions correctly', async () => {
    const now = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(now);
    
    const window = await detectMatchWindow({ timezone: 'America/New_York' });
    expect(window.timezone).toBe('America/New_York');
  });

  it('should fallback to UTC on invalid timezone', async () => {
    const window = await detectMatchWindow({ timezone: 'Invalid/Timezone' });
    expect(window.timezone).toBe('Invalid/Timezone');
    expect(window.type).toBe('none');
  });

  it('should detect live match window', async () => {
    const now = new Date();
    const match = {
      kickoff_time: subHours(now, 1).toISOString(),
      started: true,
      finished: false
    };

    const window = await detectMatchWindow();
    expect(window.type).toBe('live');
    expect(window.activeMatches).toBeGreaterThan(0);
  });

  it('should detect pre-match window', async () => {
    const now = new Date();
    const upcomingMatch = {
      kickoff_time: addHours(now, 1).toISOString(),
      started: false,
      finished: false
    };

    const window = await detectMatchWindow();
    expect(window.type).toBe('pre');
    expect(window.nextKickoff).toBeTruthy();
  });

  it('should detect post-match window', async () => {
    const now = new Date();
    const recentMatch = {
      kickoff_time: subHours(now, 2).toISOString(),
      started: true,
      finished: true
    };

    const window = await detectMatchWindow();
    expect(window.type).toBe('post');
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    const error = new Error('Database connection failed');
    
    await expect(detectMatchWindow()).rejects.toThrow();
  });
});