import { logDebug } from '../logging.ts';
import { ScoringRules } from '../types.ts';

export function calculateCardPoints(yellowCards: number, redCards: number, rules: ScoringRules): number {
  const points = (yellowCards * rules.yellow_cards) + (redCards * rules.red_cards);
  if (points !== 0) {
    logDebug('calculate-points', `Deducted ${Math.abs(points)} points for ${yellowCards} yellow and ${redCards} red cards`);
  }
  return points;
}