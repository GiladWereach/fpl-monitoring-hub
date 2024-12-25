import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface BenchPlayersProps {
  benchPlayers: any[];
  getPlayerData: (position: number) => any;
}

export function BenchPlayers({ benchPlayers, getPlayerData }: BenchPlayersProps) {
  return (
    <div className="bench-container">
      <h3 className="text-sm font-medium mb-2 text-foreground/60">Substitutes</h3>
      <div className="space-y-2">
        {benchPlayers.map((position, index) => {
          const player = getPlayerData(position);
          if (!player) return null;
          
          return (
            <HoverCard key={position}>
              <HoverCardTrigger>
                <div className="bench-player-card">
                  <span className="text-xs text-foreground/60">#{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{player?.web_name}</p>
                    <span className="text-xs text-accent">{player.points} pts</span>
                  </div>
                </div>
              </HoverCardTrigger>
              {player.liveData && (
                <HoverCardContent className="w-64 bg-secondary/95 backdrop-blur-sm border-accent/20">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/60">Minutes</span>
                      <span className="text-sm font-medium">{player.liveData.minutes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/60">Goals</span>
                      <span className="text-sm font-medium">{player.liveData.goals_scored}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground/60">Assists</span>
                      <span className="text-sm font-medium">{player.liveData.assists}</span>
                    </div>
                  </div>
                </HoverCardContent>
              )}
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
}