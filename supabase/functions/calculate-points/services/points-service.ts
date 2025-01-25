import { LivePerformance, ScoringRules } from '../types.ts';
import { logDebug, logError } from '../logging.ts';
import { calculateBonusPoints } from '../calculators/bonusCalculator.ts';

export async function calculatePlayerPoints(
  performance: LivePerformance,
  rules: ScoringRules,
  fixturePerformances: LivePerformance[]
) {
  try {
    logDebug('points-service', `Calculating points for player ${performance.player_id}`, {
      minutes: performance.minutes,
      goals: performance.goals_scored,
      assists: performance.assists
    });

    // Ensure all values are defined with fallbacks to 0
    const minutes = performance.minutes || 0;
    const goalsScored = performance.goals_scored || 0;
    const cleanSheets = performance.clean_sheets || 0;
    const goalsConceded = performance.goals_conceded || 0;
    const assists = performance.assists || 0;
    const penaltiesSaved = performance.penalties_saved || 0;
    const penaltiesMissed = performance.penalties_missed || 0;
    const ownGoals = performance.own_goals || 0;
    const yellowCards = performance.yellow_cards || 0;
    const redCards = performance.red_cards || 0;
    const saves = performance.saves || 0;
    const elementType = performance.player?.element_type;

    if (!elementType) {
      throw new Error(`Missing element type for player ${performance.player_id}`);
    }

    // Calculate individual point components
    const minutesPoints = minutes >= 60 ? rules.long_play : (minutes > 0 ? rules.short_play : 0);
    
    const goalsPoints = (() => {
      switch (elementType) {
        case 1: return goalsScored * rules.goals_scored_gkp;
        case 2: return goalsScored * rules.goals_scored_def;
        case 3: return goalsScored * rules.goals_scored_mid;
        case 4: return goalsScored * rules.goals_scored_fwd;
        default: return 0;
      }
    })();

    const cleanSheetPoints = (() => {
      if (cleanSheets === 0 || minutes < 60) return 0;
      switch (elementType) {
        case 1: return rules.clean_sheets_gkp;
        case 2: return rules.clean_sheets_def;
        case 3: return rules.clean_sheets_mid;
        default: return 0;
      }
    })();

    const goalsConcededPoints = (() => {
      if (goalsConceded === 0 || minutes < 60 || (elementType !== 1 && elementType !== 2)) return 0;
      return Math.floor(goalsConceded / 2) * -1;
    })();

    const assistPoints = assists * rules.assists;
    const penaltySavePoints = penaltiesSaved * rules.penalties_saved;
    const penaltyMissPoints = penaltiesMissed * rules.penalties_missed;
    const ownGoalPoints = ownGoals * rules.own_goals;
    const cardPoints = (yellowCards * rules.yellow_cards) + (redCards * rules.red_cards);
    const savePoints = Math.floor(saves / 3) * rules.saves;

    // Calculate bonus points
    const bonusPoints = calculateBonusPoints(
      [{
        player_id: performance.player_id,
        bps: performance.bps || 0,
        fixture_id: performance.fixture_id || 0,
        minutes: minutes
      }],
      fixturePerformances.map(p => ({
        player_id: p.player_id,
        bps: p.bps || 0,
        fixture_id: p.fixture_id || 0,
        minutes: p.minutes || 0
      }))
    );

    // Calculate raw total before bonus
    const rawTotalPoints = 
      minutesPoints +
      goalsPoints +
      cleanSheetPoints +
      goalsConcededPoints +
      assistPoints +
      penaltySavePoints +
      penaltyMissPoints +
      ownGoalPoints +
      cardPoints +
      savePoints;

    // Final total including bonus
    const finalTotalPoints = rawTotalPoints + bonusPoints;

    logDebug('points-service', `Points breakdown for player ${performance.player_id}:`, {
      minutesPoints,
      goalsPoints,
      cleanSheetPoints,
      goalsConcededPoints,
      assistPoints,
      penaltySavePoints,
      penaltyMissPoints,
      ownGoalPoints,
      cardPoints,
      savePoints,
      bonusPoints,
      rawTotalPoints,
      finalTotalPoints
    });

    return {
      minutes_points: minutesPoints,
      goals_scored_points: goalsPoints,
      clean_sheet_points: cleanSheetPoints,
      goals_conceded_points: goalsConcededPoints,
      saves_points: savePoints,
      assist_points: assistPoints,
      penalty_save_points: penaltySavePoints,
      penalty_miss_points: penaltyMissPoints,
      own_goal_points: ownGoalPoints,
      card_points: cardPoints,
      bonus_points: bonusPoints,
      raw_total_points: rawTotalPoints,
      final_total_points: finalTotalPoints
    };
  } catch (error) {
    logError('points-service', `Error calculating points for player ${performance.player_id}:`, error);
    throw error;
  }
}