export const calculateTotalPoints = (
  picks: any[],
  getPlayerData: (pick: any) => any
) => {
  // Only count players in starting 11 (positions 1-11)
  return picks
    .filter((pick) => pick?.position <= 11)
    .reduce((sum, pick) => {
      const playerData = getPlayerData(pick);
      return sum + (playerData?.points || 0);
    }, 0);
};

export const calculateBenchPoints = (
  picks: any[],
  getPlayerData: (pick: any) => any
) => {
  // Only count bench players (positions 12-15)
  return picks
    .filter((pick) => pick?.position > 11)
    .reduce((sum, pick) => {
      const playerData = getPlayerData(pick);
      return sum + (playerData?.points || 0);
    }, 0);
};