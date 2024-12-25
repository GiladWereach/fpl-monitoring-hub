import React from 'react';
import { Check, AlertCircle, Clock, X, Play } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PlayerStatusProps {
  player: any;
  liveData?: any;
}

export function PlayerStatus({ player, liveData }: PlayerStatusProps) {
  const getPlayerStatus = () => {
    // First check player availability from players table
    if (player?.chance_of_playing_this_round === 0) {
      return {
        icon: X,
        color: 'text-red-500',
        animate: false,
        label: 'Not Available'
      };
    }

    if (player?.chance_of_playing_this_round !== null && player?.chance_of_playing_this_round < 100) {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        animate: false,
        label: 'Doubtful'
      };
    }

    // Then check match and performance status
    if (liveData) {
      // Player is in an active match
      if (liveData.minutes > 0 && !liveData.finished) {
        return {
          icon: Play,
          color: 'text-[#3DFF9A]',
          animate: true,
          label: 'In Play'
        };
      }

      // Match is finished and player participated
      if (liveData.finished && liveData.minutes > 0) {
        return {
          icon: Check,
          color: 'text-gray-400',
          animate: false,
          label: 'Finished'
        };
      }

      // Match is finished but player didn't play
      if (liveData.finished) {
        return {
          icon: X,
          color: 'text-gray-400',
          animate: false,
          label: 'Unused'
        };
      }
    }

    // Default: Yet to play
    return {
      icon: Clock,
      color: 'text-blue-400',
      animate: false,
      label: 'Yet to Play'
    };
  };

  const status = getPlayerStatus();
  const Icon = status.icon;

  return (
    <div className="absolute bottom-1 left-1">
      <Icon 
        className={cn(
          "h-4 w-4",
          status.color,
          status.animate && "animate-pulse"
        )}
        aria-label={status.label}
      />
    </div>
  );
}