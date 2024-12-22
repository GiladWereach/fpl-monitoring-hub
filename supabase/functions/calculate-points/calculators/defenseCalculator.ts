import { ScoringRules } from '../types.ts';
import { logDebug } from '../logging.ts';

export function calculateCleanSheetPoints(cleanSheets: number, position: number, rules: ScoringRules): number {
  if (cleanSheets === 0) return 0;
  
  let points = 0;
  switch (position) {
    case 1: points = rules.clean_sheets_gkp; break;
    case 2: points = rules.clean_sheets_def; break;
    case 3: points = rules.clean_sheets_mid; break;
    default: points = 0;
  }

  logDebug('calculate-points', `Awarded ${points} clean sheet points to position ${position}`);
  return points;
}

export function calculateGoalsConcededPoints(goalsConceded: number, position: number, rules: ScoringRules): number {
  if (goalsConceded === 0 || (position !== 1 && position !== 2)) return 0;
  
  const points = Math.floor(goalsConceded / 2) * -1;
  logDebug('calculate-points', `Deducted ${Math.abs(points)} points for ${goalsConceded} goals conceded`);
  return points;
}