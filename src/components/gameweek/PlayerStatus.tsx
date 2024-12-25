import React from 'react';
import { Check, AlertCircle, Clock, X, Play } from 'lucide-react';
import { cn } from "@/lib/utils";

interface PlayerStatusProps {
  player: any;
  liveData?: any;
}

export function PlayerStatus({ player, liveData }: PlayerStatusProps) {
  const getPlayerStatus = () => {
    // Check if player is in play (highest priority)
    if (liveData?.minutes > 0 && !liveData?.finished) {
      return {
        icon: Play,
        color: 'text-[#3DFF9A]',
        animate: true,
        label: 'In Play'
      };
    }

    // Check if match is finished
    if (liveData?.finished) {
      return {
        icon: Check,
        color: 'text-gray-400',
        animate: false,
        label: 'Finished'
      };
    }

    // Check if player is not available
    if (player?.chance_of_playing_next_round === 0) {
      return {
        icon: X,
        color: 'text-red-500',
        animate: false,
        label: 'Not Available'
      };
    }

    // Check if player is doubtful
    if (player?.chance_of_playing_next_round < 100) {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        animate: false,
        label: 'Doubtful'
      };
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
    <div className="absolute top-1 left-1">
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