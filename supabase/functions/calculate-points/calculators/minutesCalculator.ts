import { ScoringRules } from '../types.ts';
import { logDebug } from '../logging.ts';

export function calculateMinutesPoints(minutes: number | null, rules: ScoringRules): number {
  if (minutes === null || minutes === 0) {
    logDebug('calculate-points', `No minutes points awarded for ${minutes} minutes`);
    return 0;
  }

  // Award 2 points for playing 60 minutes or more, 1 point for playing less than 60 minutes
  const points = minutes >= 60 ? rules.long_play : rules.short_play;
  logDebug('calculate-points', `Awarded ${points} points for ${minutes} minutes played`);
  return points;
}