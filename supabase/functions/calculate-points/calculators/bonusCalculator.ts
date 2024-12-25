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
    const firstPlaceBps = bpsValues[0];
    const secondPlaceBps = bpsValues[1];
    const thirdPlaceBps = bpsValues[2];

    if (currentPlayerBps === firstPlaceBps) {
      // If tied for first, all players get 3 points
      bonusPoints = 3;
    } else if (currentPlayerBps === secondPlaceBps) {
      if (bpsGroups[firstPlaceBps].length > 1) {
        // If there was a tie for first, second place gets 1 point
        bonusPoints = 1;
      } else {
        // If tied for second, all second place players get 2 points
        bonusPoints = 2;
      }
    } else if (currentPlayerBps === thirdPlaceBps) {
      if (bpsGroups[firstPlaceBps].length > 1) {
        // If there was a tie for first, third place gets no points
        bonusPoints = 0;
      } else if (bpsGroups[secondPlaceBps]?.length > 1) {
        // If there was a tie for second, third place gets no points
        bonusPoints = 0;
      } else {
        // Normal third place or tied for third gets 1 point
        bonusPoints = 1;
      }
    }
  }

  logDebug('calculate-points', `Calculated bonus points for player ${currentPlayer.player_id}: ${bonusPoints} (BPS: ${currentPlayerBps})`);
  
  return bonusPoints;
}