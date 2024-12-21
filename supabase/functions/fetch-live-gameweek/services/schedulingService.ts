import { getMatchStatus } from './matchStatusService';

export interface CollectionSchedule {
  intervalMinutes: number;
  reason: string;
}

export async function determineCollectionSchedule(): Promise<CollectionSchedule> {
  console.log('Determining collection schedule...');
  
  const matchStatus = await getMatchStatus();
  
  if (matchStatus.hasActiveMatches && matchStatus.isMatchDay) {
    return {
      intervalMinutes: 2,
      reason: 'Active matches in progress'
    };
  }

  // Check if we're in a live gameweek but between matches
  if (matchStatus.matchDayWindow.start) {
    const now = new Date();
    const gameweekEnd = matchStatus.matchDayWindow.end;
    
    if (gameweekEnd && now <= gameweekEnd) {
      return {
        intervalMinutes: 30,
        reason: 'Live gameweek - between matches'
      };
    }
  }

  // Default to daily collection
  return {
    intervalMinutes: 1440, // 24 hours
    reason: 'Outside live gameweek'
  };
}