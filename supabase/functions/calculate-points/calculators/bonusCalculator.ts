import { logDebug } from '../logging.ts';

interface PlayerBPS {
  player_id: number;
  bps: number;
  fixture_id: number;
}

export function calculateBonusPoints(playerBPS: PlayerBPS[], allFixtureBPS: PlayerBPS[]): number {
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
  
  // Group players by BPS score to handle ties
  const bpsGroups: { [key: number]: PlayerBPS[] } = {};
  sortedPlayers.forEach(player => {
    if (!bpsGroups[player.bps]) {
      bpsGroups[player.bps] = [];
    }
    bpsGroups[player.bps].push(player);
  });

  // Sort BPS values in descending order
  const bpsValues = Object.keys(bpsGroups)
    .map(Number)
    .sort((a, b) => b - a);

  let bonusPoints = 0;
  const currentPlayerBps = currentPlayer.bps;

  // Handle different tie scenarios
  if (bpsValues.length > 0) {
    if (currentPlayerBps === bpsValues[0]) {
      bonusPoints = 3; // Highest BPS
    } else if (currentPlayerBps === bpsValues[1]) {
      bonusPoints = bpsGroups[bpsValues[0]].length > 1 ? 1 : 2;
    } else if (currentPlayerBps === bpsValues[2]) {
      if (bpsGroups[bpsValues[0]].length > 1) {
        bonusPoints = 0;
      } else if (bpsGroups[bpsValues[1]]?.length > 1) {
        bonusPoints = 0;
      } else {
        bonusPoints = 1;
      }
    }
  }

  logDebug('calculate-points', `Calculated bonus points for player ${currentPlayer.player_id}: ${bonusPoints} (BPS: ${currentPlayerBps})`);
  return bonusPoints;
}