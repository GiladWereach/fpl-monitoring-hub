import React from 'react';
import { cn } from "@/lib/utils";
import { PlayerStatusConfig } from '../utils/playerStatusUtils';

interface StatusIconProps {
  status: PlayerStatusConfig;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const Icon = status.icon;

  return (
    <div className="absolute bottom-1 left-1">
      <Icon 
        className={cn(
          "h-4 w-4",
          status.animate && "animate-pulse"
        )}
        color={status.color}
        aria-label={status.label}
      />
    </div>
  );
};