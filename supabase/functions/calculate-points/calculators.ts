import { LivePerformance, Player, ScoringRules } from './types.ts';

export function calculateMinutesPoints(minutes: number, rules: ScoringRules): number {
  if (minutes === 0) return 0;
  return minutes >= 60 ? rules.long_play : rules.short_play;
}

export function calculateGoalPoints(goals: number, position: number, rules: ScoringRules): number {
  if (goals === 0) return 0;
  
  switch (position) {
    case 1: return goals * rules.goals_scored_gkp;
    case 2: return goals * rules.goals_scored_def;
    case 3: return goals * rules.goals_scored_mid;
    case 4: return goals * rules.goals_scored_fwd;
    default: return 0;
  }
}

export function calculateCleanSheetPoints(cleanSheets: number, position: number, rules: ScoringRules): number {
  if (cleanSheets === 0) return 0;
  
  switch (position) {
    case 1: return rules.clean_sheets_gkp;
    case 2: return rules.clean_sheets_def;
    case 3: return rules.clean_sheets_mid;
    default: return 0;
  }
}

export function calculateGoalsConcededPoints(goalsConceded: number, position: number, rules: ScoringRules): number {
  // Only GKP and DEF get negative points for goals conceded
  if (goalsConceded === 0 || (position !== 1 && position !== 2)) return 0;
  
  // For every 2 goals conceded, -1 point
  const points = Math.floor(goalsConceded / 2) * -1;
  return position === 1 ? points : points;
}

export function calculateSavePoints(saves: number, position: number, rules: ScoringRules): number {
  if (position !== 1) return 0;
  return Math.floor(saves / 3) * rules.saves;
}

export function calculateCardPoints(yellowCards: number, redCards: number, rules: ScoringRules): number {
  return (yellowCards * rules.yellow_cards) + (redCards * rules.red_cards);
}

export function calculatePenaltyPoints(
  penaltiesSaved: number,
  penaltiesMissed: number,
  rules: ScoringRules
): number {
  return (penaltiesSaved * rules.penalties_saved) + (penaltiesMissed * rules.penalties_missed);
}

// Remove the duplicate bonus points calculator and export the one from bonusCalculator.ts
export { calculateBonusPoints } from './calculators/bonusCalculator.ts';