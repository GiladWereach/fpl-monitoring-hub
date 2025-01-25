export const calculateTotalPoints = (
  picks: any[],
  getPlayerData: (pick: any) => { points: number; isCaptain: boolean }
) => {
  // Only count players in starting 11 (positions 1-11)
  return picks
    .filter((pick) => pick?.position <= 11)
    .reduce((sum, pick) => {
      const playerData = getPlayerData(pick);
      const points = playerData.points;
      // Apply captain multiplier
      return sum + (playerData.isCaptain ? points * 2 : points);
    }, 0);
};

export const calculateBenchPoints = (
  picks: any[],
  getPlayerData: (pick: any) => { points: number; isCaptain: boolean }
) => {
  // Only count bench players (positions 12-15)
  return picks
    .filter((pick) => pick?.position > 11)
    .reduce((sum, pick) => {
      const playerData = getPlayerData(pick);
      return sum + playerData.points; // No captain multiplier for bench
    }, 0);
};