import { MatchWindow } from "@/services/matchWindowService";

export function createMockMatchWindow(
  isActive: boolean = false,
  matchCount: number = 0,
  nextKickoff: Date | null = null
): MatchWindow {
  const now = new Date();
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return {
    type: isActive ? 'live' : (nextKickoff ? 'pre_match' : 'idle'),
    is_active: isActive,
    window_start: now,
    window_end: later,
    match_count: matchCount,
    next_kickoff: nextKickoff,
    matchCount,
    hasActiveMatches: isActive,
    isMatchDay: isActive || !!nextKickoff
  };
}

export function isWithinMatchWindow(window: MatchWindow): boolean {
  const now = new Date();
  return now >= window.window_start && now <= window.window_end;
}