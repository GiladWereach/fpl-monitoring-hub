import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PlayerCardProps {
  player: any;
  isCaptain: boolean;
  isViceCaptain: boolean;
  liveData?: any;
}

const PlayerCard = ({ player, isCaptain, isViceCaptain, liveData }: PlayerCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const points = liveData?.total_points || 0;
  const finalPoints = isCaptain ? points * 2 : points;

  return (
    <div 
      className="relative"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className={cn(
        "bg-secondary/80 px-4 py-2 rounded-xl border border-accent/20 hover:bg-accent/10 transition-all cursor-pointer",
        "transform hover:scale-105 duration-200",
        isExpanded && "bg-accent/10"
      )}>
        <p className="text-sm font-medium text-foreground">{player?.web_name}</p>
        {isCaptain && <span className="text-xs text-accent">(C)</span>}
        {isViceCaptain && <span className="text-xs text-accent">(V)</span>}
        <div className="text-xs mt-1 text-accent">{finalPoints} pts</div>
        <div className="flex items-center justify-center mt-1">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-accent/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-accent/60" />
          )}
        </div>
      </div>
      
      {isExpanded && liveData && (
        <div className="absolute z-10 w-64 p-4 mt-2 bg-secondary/95 backdrop-blur-sm border border-accent/20 rounded-xl shadow-xl">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Minutes</span>
              <span className="text-sm font-medium text-foreground">{liveData.minutes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Goals</span>
              <span className="text-sm font-medium text-foreground">{liveData.goals_scored}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Assists</span>
              <span className="text-sm font-medium text-foreground">{liveData.assists}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Clean Sheet</span>
              <span className="text-sm font-medium text-foreground">{liveData.clean_sheets ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Bonus</span>
              <span className="text-sm font-medium text-foreground">{liveData.bonus}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface BenchPlayerProps {
  player: any;
  liveData?: any;
  position: number;
}

const BenchPlayer = ({ player, liveData, position }: BenchPlayerProps) => {
  const points = liveData?.total_points || 0;
  
  return (
    <HoverCard>
      <HoverCardTrigger>
        <div className="bg-secondary/60 px-3 py-2 rounded-lg border border-accent/10 hover:bg-accent/5 transition-colors">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-foreground/60">{position}</span>
            <div>
              <p className="text-sm font-medium text-foreground">{player?.web_name}</p>
              <span className="text-xs text-accent">{points} pts</span>
            </div>
          </div>
        </div>
      </HoverCardTrigger>
      {liveData && (
        <HoverCardContent className="w-64 bg-secondary/95 backdrop-blur-sm border-accent/20">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Minutes</span>
              <span className="text-sm font-medium">{liveData.minutes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Goals</span>
              <span className="text-sm font-medium">{liveData.goals_scored}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground/60">Assists</span>
              <span className="text-sm font-medium">{liveData.assists}</span>
            </div>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
};

interface PitchViewProps {
  teamSelection?: any;
  players?: any[];
  liveData?: any[];
}

export function PitchView({ teamSelection, players, liveData }: PitchViewProps) {
  const getPlayerByPosition = (position: number) => {
    if (!teamSelection || !players) return null;
    const pick = teamSelection.picks.find(p => p.position === position);
    if (!pick) return null;
    
    const player = players.find(p => p.id === pick.element);
    const playerLiveData = liveData?.find(d => d.player_id === pick.element);
    
    return {
      ...player,
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
      liveData: playerLiveData
    };
  };

  const getBenchPlayer = (position: number) => {
    if (!teamSelection || !players) return null;
    const pick = teamSelection.picks.find(p => p.position === position);
    if (!pick) return null;
    
    const player = players.find(p => p.id === pick.element);
    const playerLiveData = liveData?.find(d => d.player_id === pick.element);
    
    return {
      ...player,
      liveData: playerLiveData
    };
  };

  return (
    <Card className="glass-card p-6">
      <div className="relative h-[600px] w-full">
        {/* Pitch Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent rounded-lg border border-accent/10">
          {/* Field Lines */}
          <div className="absolute inset-0 flex">
            <div className="w-1/3 border-r border-accent/20" />
            <div className="w-1/3 border-r border-accent/20" />
          </div>
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-accent/20 rounded-full" />
        </div>
        
        {/* Player Positions */}
        <div className="absolute inset-0 flex">
          {/* GK Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[1].map(position => {
                const player = getPlayerByPosition(position);
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={position}
                    player={player}
                    isCaptain={player.isCaptain}
                    isViceCaptain={player.isViceCaptain}
                    liveData={player.liveData}
                  />
                );
              })}
            </div>
          </div>
          
          {/* DEF Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[2, 3, 4, 5].map(position => {
                const player = getPlayerByPosition(position);
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={position}
                    player={player}
                    isCaptain={player.isCaptain}
                    isViceCaptain={player.isViceCaptain}
                    liveData={player.liveData}
                  />
                );
              })}
            </div>
          </div>
          
          {/* MID Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[6, 7, 8].map(position => {
                const player = getPlayerByPosition(position);
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={position}
                    player={player}
                    isCaptain={player.isCaptain}
                    isViceCaptain={player.isViceCaptain}
                    liveData={player.liveData}
                  />
                );
              })}
            </div>
          </div>
          
          {/* FWD Column */}
          <div className="w-1/4 flex items-center justify-center">
            <div className="space-y-4">
              {[9, 10, 11].map(position => {
                const player = getPlayerByPosition(position);
                if (!player) return null;
                return (
                  <PlayerCard 
                    key={position}
                    player={player}
                    isCaptain={player.isCaptain}
                    isViceCaptain={player.isViceCaptain}
                    liveData={player.liveData}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Bench Section */}
        <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center space-x-4">
          {[12, 13, 14, 15].map(position => {
            const player = getBenchPlayer(position);
            if (!player) return null;
            return (
              <BenchPlayer 
                key={position}
                player={player}
                liveData={player.liveData}
                position={position}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}