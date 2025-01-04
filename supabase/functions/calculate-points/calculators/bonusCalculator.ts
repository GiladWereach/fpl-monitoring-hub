interface BPSData {
  player_id: number;
  bps: number;
  fixture_id: number;
}

export const calculateBonusPoints = (playerBPSData: BPSData[], fixtureBPSData: BPSData[]): number => {
  // If no BPS data available, no bonus points
  if (!playerBPSData?.length || !fixtureBPSData?.length) return 0;

  // Get all BPS values for this fixture
  const allBpsInFixture = fixtureBPSData.map(d => d.bps);
  
  // Sort BPS in descending order and get unique values
  const uniqueBps = [...new Set(allBpsInFixture)].sort((a, b) => b - a);
  
  // Get player's BPS
  const playerBps = playerBPSData[0]?.bps || 0;
  
  // Get index of current BPS in unique sorted array
  const bpsIndex = uniqueBps.indexOf(playerBps);
  
  // If not in top 3 unique BPS values, no bonus points
  if (bpsIndex >= 3) return 0;
  
  // Assign bonus points based on position in unique BPS values
  // If same BPS, they get the same points
  switch (bpsIndex) {
    case 0: return 3; // Highest unique BPS
    case 1: return 2; // Second highest unique BPS
    case 2: return 1; // Third highest unique BPS
    default: return 0;
  }
};