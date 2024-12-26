import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectMatchWindow, MatchWindow } from './matchWindowService';
import { createMockMatchWindow } from '@/utils/tests/matchWindowTestUtils';

describe('Match Window Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should detect live match window correctly', async () => {
    const now = new Date('2024-01-01T15:00:00Z');
    vi.setSystemTime(now);
    
    const window = await detectMatchWindow();
    expect(window.type).toBe('live');
    expect(window.is_active).toBe(true);
    expect(window.match_count).toBeGreaterThan(0);
  });

  it('should detect pre-match window correctly', async () => {
    const now = new Date('2024-01-01T13:00:00Z');
    vi.setSystemTime(now);
    
    const window = await detectMatchWindow();
    expect(window.type).toBe('pre_match');
    expect(window.is_active).toBe(false);
    expect(window.next_kickoff).toBeDefined();
  });

  it('should detect post-match window correctly', async () => {
    const now = new Date('2024-01-01T17:00:00Z');
    vi.setSystemTime(now);
    
    const window = await detectMatchWindow();
    expect(window.type).toBe('post_match');
    expect(window.is_active).toBe(false);
  });

  it('should handle timezone correctly', async () => {
    const window = await detectMatchWindow({ timezone: 'America/New_York' });
    expect(window).toBeDefined();
  });

  it('should return idle state when no matches', async () => {
    const window = await detectMatchWindow();
    expect(window.type).toBe('idle');
    expect(window.is_active).toBe(false);
    expect(window.match_count).toBe(0);
  });
});