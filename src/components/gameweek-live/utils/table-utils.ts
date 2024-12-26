import { PlayerPerformanceData } from '../types';

export const getRowClassName = (
  perf: PlayerPerformanceData,
  matchId: number | null | undefined,
  homeTeam?: string,
  awayTeam?: string
): string => {
  if (!matchId || !homeTeam || !awayTeam) return '';
  return perf.player.team.short_name === awayTeam ? 'bg-[#1a2234]' : '';
};