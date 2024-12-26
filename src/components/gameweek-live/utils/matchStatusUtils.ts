import { MatchStatus } from '@/components/dashboard/services/matchStatusService';

interface MatchStatusInfo {
  status: string;
  color: string;
  isPreMatch: boolean;
  reason?: string;
}

export const getMatchStatusInfo = (match: any, matchStatus: MatchStatus | undefined): MatchStatusInfo => {
  const kickoff = new Date(match.kickoff_time);
  const now = new Date();
  
  // Check for postponed/abandoned matches first
  if (match.postponed) {
    if (match.started && match.minutes > 0) {
      return { 
        status: 'ABANDONED', 
        color: 'bg-red-500', 
        isPreMatch: false,
        reason: match.postponement_reason || 'Match abandoned'
      };
    }
    return { 
      status: 'POSTPONED', 
      color: 'bg-red-500', 
      isPreMatch: false,
      reason: match.postponement_reason
    };
  }
  
  // Pre-match window check
  if (!match.started && matchStatus?.isMatchDay) {
    const preMatchStart = new Date(kickoff);
    preMatchStart.setHours(preMatchStart.getHours() - 2);
    if (now >= preMatchStart) {
      return { status: 'PRE-MATCH', color: 'bg-yellow-500', isPreMatch: true };
    }
  }

  // Standard status checks
  if (!match.started) {
    return { status: 'UPCOMING', color: 'bg-gray-500', isPreMatch: false };
  }
  if (match.finished_provisional) {
    return { status: 'FINISHED', color: 'bg-blue-500', isPreMatch: false };
  }
  if (match.finished && !match.finished_provisional) {
    return { status: 'CALCULATING', color: 'bg-yellow-500', isPreMatch: false };
  }
  if (match.started && !match.finished) {
    // Check for extra time
    if (match.minutes > 90) {
      const extraMinutes = match.minutes - 90;
      return { 
        status: `ET ${extraMinutes}'`, 
        color: 'bg-purple-500', 
        isPreMatch: false 
      };
    }
    return { status: 'LIVE', color: 'bg-green-500', isPreMatch: false };
  }
  return { status: 'UNKNOWN', color: 'bg-gray-500', isPreMatch: false };
};