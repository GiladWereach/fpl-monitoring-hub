import { PlayerPerformanceData, PointsCalculation } from '@/components/gameweek-live/types';

interface BPSData {
  player_id: number;
  bps: number;
  fixture_id: number | null;
  minutes: number;
}

export interface PointsBreakdown {
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsConceded: number;
  ownGoals: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  bonus: number;
  total: number;
}

export function calculatePlayerPoints(
  performance: PlayerPerformanceData,
  isCaptain: boolean = false,
  isViceCaptain: boolean = false,
  fixturePerformances?: PlayerPerformanceData[]
): PointsBreakdown {
  console.log(`Calculating points for player ${performance.player.web_name}`, {
    performance,
    isCaptain,
    isViceCaptain,
    fixturePerformances: fixturePerformances?.length
  });

  // Calculate base points from performance data
  const basePoints = {
    minutes: calculateMinutesPoints(performance.minutes),
    goals: calculateGoalsPoints(performance.goals_scored, performance.player.element_type),
    assists: performance.assists * 3,
    cleanSheets: calculateCleanSheetPoints(performance.clean_sheets, performance.player.element_type),
    goalsConceded: calculateGoalsConcededPoints(performance.goals_conceded, performance.player.element_type),
    ownGoals: performance.own_goals * -2,
    penaltiesSaved: performance.penalties_saved * 5,
    penaltiesMissed: performance.penalties_missed * -2,
    yellowCards: performance.yellow_cards * -1,
    redCards: performance.red_cards * -3,
    saves: Math.floor(performance.saves / 3),
    bonus: 0
  };

  // Calculate bonus points if we have fixture performances
  if (fixturePerformances?.length && performance.fixture_id) {
    const bpsData: BPSData[] = fixturePerformances
      .filter(p => p.fixture_id === performance.fixture_id)
      .map(p => ({
        player_id: p.player.id,
        bps: p.bps,
        fixture_id: p.fixture_id,
        minutes: p.minutes
      }));

    const playerBPSData = [{
      player_id: performance.player.id,
      bps: performance.bps,
      fixture_id: performance.fixture_id,
      minutes: performance.minutes
    }];

    basePoints.bonus = calculateBonusPoints(playerBPSData, bpsData);
  }

  // Calculate total before captain multiplier
  const totalBeforeMultiplier = Object.values(basePoints).reduce((sum, points) => sum + points, 0);

  // Apply captain multiplier
  const multiplier = isCaptain ? 2 : 1;
  const total = totalBeforeMultiplier * multiplier;

  console.log(`Points breakdown for ${performance.player.web_name}:`, {
    ...basePoints,
    totalBeforeMultiplier,
    multiplier,
    total
  });

  return {
    ...basePoints,
    total
  };
}

function calculateMinutesPoints(minutes: number): number {
  if (minutes === 0) return 0;
  return minutes >= 60 ? 2 : 1;
}

function calculateGoalsPoints(goals: number, elementType: number): number {
  const pointsPerGoal = elementType === 1 ? 6 : // GK
                        elementType === 2 ? 6 : // DEF
                        elementType === 3 ? 5 : // MID
                        4; // FWD
  return goals * pointsPerGoal;
}

function calculateCleanSheetPoints(cleanSheets: number, elementType: number): number {
  if (cleanSheets === 0) return 0;
  
  const pointsForCleanSheet = elementType === 1 ? 4 : // GK
                             elementType === 2 ? 4 : // DEF
                             elementType === 3 ? 1 : // MID
                             0; // FWD
  return cleanSheets * pointsForCleanSheet;
}

function calculateGoalsConcededPoints(goalsConceded: number, elementType: number): number {
  if (elementType > 2) return 0; // Only GK and DEF lose points for goals conceded
  return Math.floor(goalsConceded / 2) * -1;
}

function calculateBonusPoints(playerBPSData: BPSData[], fixtureBPSData: BPSData[]): number {
  // If no BPS data available or player hasn't played, no bonus points
  if (!playerBPSData?.length || !fixtureBPSData?.length) return 0;
  
  // Get player's minutes and BPS
  const playerMinutes = playerBPSData[0]?.minutes || 0;
  const playerBps = playerBPSData[0]?.bps || 0;
  
  // If player hasn't played any minutes, they can't get bonus points
  if (playerMinutes === 0) return 0;

  // Get all BPS values for players who have played minutes
  const playersWithMinutes = fixtureBPSData.filter(d => d.minutes > 0);
  
  // Sort BPS in descending order
  const sortedPlayers = [...playersWithMinutes].sort((a, b) => b.bps - a.bps);
  
  // If no players with minutes or player's BPS is 0, no bonus points
  if (!sortedPlayers.length || playerBps === 0) return 0;

  // Get unique BPS values in descending order
  const uniqueBpsValues = [...new Set(sortedPlayers.map(p => p.bps))].sort((a, b) => b - a);
  
  // Handle ties according to FPL rules
  const playerPosition = sortedPlayers.findIndex(p => p.bps === playerBps);
  
  // First place tie
  if (playerPosition === 0) {
    return 3;
  } else if (playerPosition > 0 && playerBps === sortedPlayers[0].bps) {
    return 3; // Also tied for first
  }
  
  // Second place tie
  if (playerPosition === 1 || (playerBps === sortedPlayers[1]?.bps && playerBps !== sortedPlayers[0].bps)) {
    return 2;
  }
  
  // Third place tie
  if (playerPosition === 2 || (playerBps === sortedPlayers[2]?.bps && playerBps !== sortedPlayers[1].bps)) {
    return 1;
  }
  
  return 0;
}