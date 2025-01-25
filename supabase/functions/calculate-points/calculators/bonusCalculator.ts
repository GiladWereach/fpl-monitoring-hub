interface BPSData {
  player_id: number;
  bps: number;
  fixture_id: number;
  minutes: number;
}

export const calculateBonusPoints = (playerBPSData: BPSData[], fixtureBPSData: BPSData[]): number => {
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
};