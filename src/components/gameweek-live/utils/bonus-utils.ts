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
  const allBpsInFixture = fixtureBPSData
    .filter(d => d.minutes > 0)  // Only consider players who played
    .map(d => d.bps);
  
  // Sort BPS in descending order and get unique values
  const uniqueBps = [...new Set(allBpsInFixture)].sort((a, b) => b - a);
  
  // Get index of current BPS in unique sorted array
  const bpsIndex = uniqueBps.indexOf(playerBps);
  
  // If not in top 3 unique BPS values or BPS is 0, no bonus points
  if (bpsIndex >= 3 || playerBps === 0) return 0;
  
  // Assign bonus points based on position in unique BPS values
  // If same BPS, they get the same points
  switch (bpsIndex) {
    case 0: return 3; // Highest unique BPS
    case 1: return 2; // Second highest unique BPS
    case 2: return 1; // Third highest unique BPS
    default: return 0;
  }
};