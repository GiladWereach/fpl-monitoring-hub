import { ScoringRules } from '../types';
import { logDebug } from '../logging';

export function calculateGoalPoints(goals: number, position: number, rules: ScoringRules): number {
  if (goals === 0) return 0;
  
  let points = 0;
  switch (position) {
    case 1: points = goals * rules.goals_scored_gkp; break;
    case 2: points = goals * rules.goals_scored_def; break;
    case 3: points = goals * rules.goals_scored_mid; break;
    case 4: points = goals * rules.goals_scored_fwd; break;
    default: points = 0;
  }

  logDebug('calculate-points', `Awarded ${points} points for ${goals} goals to position ${position}`);
  return points;
}