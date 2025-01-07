import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGameweekPerformance } from '@/hooks/useGameweekPerformance';
import { PerformanceTable } from './components/PerformanceTable';
import { useToast } from '@/hooks/use-toast';

const PlayerPerformance = ({ gameweek, matchId }: { gameweek: number; matchId?: number | null }) => {
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { data: performances, isLoading, error } = useGameweekPerformance(gameweek, matchId);

  if (isLoading) {
    return <div>Loading performances...</div>;
  }

  if (error) {
    toast({
      title: "Error loading performance data",
      description: "Please try refreshing the page",
      variant: "destructive",
    });
    return (
      <div className="p-4 text-red-500">
        Error loading data. Please try refreshing the page.
      </div>
    );
  }

  const filteredPerformances = performances?.filter(p => 
    p.player.web_name.toLowerCase().includes(search.toLowerCase()) ||
    p.player.team.short_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="outline">
          {matchId ? 'Showing match details' : 'Showing all matches'}
        </Badge>
      </div>

      <div className="rounded-md border">
        <PerformanceTable
          performances={filteredPerformances || []}
          matchId={matchId}
        />
      </div>
    </div>
  );
};

export default PlayerPerformance;