import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectMatchWindow, MatchWindow } from './matchWindowService';
import { createMockFixture } from '@/utils/tests/matchWindowTestUtils';

describe('Match Window Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should detect live match window correctly', async () => {
    const now = new Date('2024-01-01T15:00:00Z');
    vi.setSystemTime(now);
    
    const mockFixture = createMockFixture(
      new Date('2024-01-01T14:30:00Z'),
      true,  // started
      false  // not finished
    );

    const window = await detectMatchWindow();
    expect(window.type).toBe('live');
    expect(window.hasActiveMatches).toBe(true);
  });

  it('should detect pre-match window correctly', async () => {
    const now = new Date('2024-01-01T13:00:00Z');
    vi.setSystemTime(now);
    
    const mockFixture = createMockFixture(
      new Date('2024-01-01T15:00:00Z'),
      false,  // not started
      false   // not finished
    );

    const window = await detectMatchWindow();
    expect(window.type).toBe('pre');
    expect(window.hasActiveMatches).toBe(false);
    expect(window.nextKickoff).toBeDefined();
  });

  it('should detect post-match window correctly', async () => {
    const now = new Date('2024-01-01T17:00:00Z');
    vi.setSystemTime(now);
    
    const mockFixture = createMockFixture(
      new Date('2024-01-01T15:00:00Z'),
      true,   // started
      true    // finished
    );

    const window = await detectMatchWindow();
    expect(window.type).toBe('post');
    expect(window.hasActiveMatches).toBe(false);
  });

  it('should handle timezone conversions correctly', async () => {
    const window = await detectMatchWindow({ timezone: 'America/New_York' });
    expect(window.timezone).toBe('America/New_York');
  });

  it('should fallback to idle state when no matches', async () => {
    const window = await detectMatchWindow();
    expect(window.type).toBe('idle');
    expect(window.hasActiveMatches).toBe(false);
  });
});