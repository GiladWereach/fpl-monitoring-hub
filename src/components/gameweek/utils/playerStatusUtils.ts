import { LucideIcon, Check, Play, OctagonX, OctagonAlert, Clock } from 'lucide-react';

export interface PlayerStatusConfig {
  icon: LucideIcon;
  color: string;
  animate: boolean;
  label: string;
}

export const getUnavailableStatus = (playerName: string): PlayerStatusConfig => {
  console.log(`${playerName} is unavailable - showing red octagon regardless of match status`);
  return {
    icon: OctagonX,
    color: '#EF4444', // Red
    animate: false,
    label: 'Not Available'
  };
};

export const getDoubtfulStatus = (playerName: string, chanceOfPlaying: number): PlayerStatusConfig => {
  console.log(`${playerName} has ${chanceOfPlaying}% chance of playing in upcoming match`);
  return {
    icon: OctagonAlert,
    color: '#FCD34D', // Yellow
    animate: false,
    label: `${chanceOfPlaying}% Chance`
  };
};

export const getFinishedStatus = (): PlayerStatusConfig => {
  return {
    icon: Check,
    color: '#9CA3AF', // Gray
    animate: false,
    label: 'Finished'
  };
};

export const getUpcomingStatus = (): PlayerStatusConfig => {
  return {
    icon: Clock,
    color: '#3B82F6', // Blue
    animate: false,
    label: 'Upcoming'
  };
};

export const getInPlayStatus = (): PlayerStatusConfig => {
  return {
    icon: Play,
    color: '#3DFF9A', // Green
    animate: true,
    label: 'In Play'
  };
};