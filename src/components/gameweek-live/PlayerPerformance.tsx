import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePerformanceQueries } from './hooks/usePerformanceQueries';
import { PerformanceTable } from './components/PerformanceTable';

const PlayerPerformance = ({ gameweek, matchId }: { gameweek: number; matchId?: number | null }) => {
  const [search, setSearch] = useState('');
  const { performancesQuery, matchDetailsQuery } = usePerformanceQueries(gameweek, matchId);

  if (performancesQuery.isLoading) {
    return <div>Loading performances...</div>;
  }

  if (performancesQuery.error || matchDetailsQuery.error) {
    return (
      <div className="p-4 text-red-500">
        Error loading data. Please try refreshing the page.
      </div>
    );
  }

  const filteredPerformances = performancesQuery.data?.filter(p => 
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
          homeTeam={matchDetailsQuery.data?.homeTeam}
          awayTeam={matchDetailsQuery.data?.awayTeam}
        />
      </div>
    </div>
  );
};

export default PlayerPerformance;