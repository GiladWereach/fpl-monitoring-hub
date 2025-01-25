import React from 'react';
import { cn } from "@/lib/utils";
import { PlayerStatusConfig } from '../utils/playerStatusUtils';

interface StatusIconProps {
  status: PlayerStatusConfig;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const Icon = status.icon;

  return (
    <div className="absolute left-1 top-1/2 -translate-y-1/2">
      <Icon 
        size={16}
        className={cn(
          "transition-colors",
          status.animate && "animate-pulse"
        )}
        color={status.color}
        aria-label={status.label}
      />
    </div>
  );
};