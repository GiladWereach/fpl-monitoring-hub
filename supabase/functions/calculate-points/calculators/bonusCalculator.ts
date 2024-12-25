import { logDebug } from '../logging.ts';

interface PlayerBPS {
  player_id: number;
  bps: number;
  fixture_id: number;
}

export function calculateBonusPoints(bonus: number, playerBPS: PlayerBPS[], allFixtureBPS: PlayerBPS[]): number {
  // If the match is finished and FPL has provided official bonus points, use those
  if (bonus !== null && bonus !== undefined) {
    logDebug('calculate-points', `Using official FPL bonus points: ${bonus}`);
    return Number(bonus);
  }

  // For live calculations, calculate based on BPS
  if (!playerBPS.length || !allFixtureBPS.length) {
    logDebug('calculate-points', 'No BPS data available for bonus calculation');
    return 0;
  }

  const currentPlayer = playerBPS[0];
  const fixtureId = currentPlayer.fixture_id;
  
  // Get all players' BPS for this fixture
  const fixturePlayers = allFixtureBPS.filter(p => p.fixture_id === fixtureId);
  
  // Sort players by BPS in descending order
  const sortedPlayers = fixturePlayers.sort((a, b) => b.bps - a.bps);
  
  // Get unique BPS values to handle ties
  const uniqueBPSValues = Array.from(new Set(sortedPlayers.map(p => p.bps)))
    .sort((a, b) => b - a);
  
  // Find position of current player's BPS in unique values
  const bpsPosition = uniqueBPSValues.indexOf(currentPlayer.bps);
  
  // Calculate bonus points based on position
  let calculatedBonus = 0;
  if (bpsPosition === 0) {
    calculatedBonus = 3; // Highest unique BPS
  } else if (bpsPosition === 1) {
    calculatedBonus = 2; // Second highest unique BPS
  } else if (bpsPosition === 2) {
    calculatedBonus = 1; // Third highest unique BPS
  }

  logDebug('calculate-points', `Calculated live bonus points for player ${currentPlayer.player_id}: ${calculatedBonus} (BPS: ${currentPlayer.bps}, Position: ${bpsPosition + 1})`);
  
  return calculatedBonus;
}

export function calculateCardPoints(yellowCards: number, redCards: number, rules: any): number {
  const points = (yellowCards * rules.yellow_cards) + (redCards * rules.red_cards);
  if (points !== 0) {
    logDebug('calculate-points', `Deducted ${Math.abs(points)} points for ${yellowCards} yellow and ${redCards} red cards`);
  }
  return points;
}
