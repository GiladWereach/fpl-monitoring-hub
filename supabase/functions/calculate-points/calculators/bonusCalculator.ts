import { ScoringRules } from '../types.ts';
import { logDebug } from '../logging.ts';

export function calculateBonusPoints(bonus: number): number {
  const points = Number(bonus) || 0;
  logDebug('calculate-points', `Awarded ${points} bonus points`);
  return points;
}

export function calculateCardPoints(yellowCards: number, redCards: number, rules: ScoringRules): number {
  const points = (yellowCards * rules.yellow_cards) + (redCards * rules.red_cards);
  if (points !== 0) {
    logDebug('calculate-points', `Deducted ${Math.abs(points)} points for ${yellowCards} yellow and ${redCards} red cards`);
  }
  return points;
}