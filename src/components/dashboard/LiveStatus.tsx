import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface LiveStatusProps {
  showLabel?: boolean;
}

export const LiveStatus = ({ showLabel = true }: LiveStatusProps) => {
  const { data: activeMatches } = useQuery({
    queryKey: ['active-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select('*')
        .eq('started', true)
        .is('finished_provisional', false);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  const isLive = activeMatches && activeMatches.length > 0;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isLive ? "success" : "secondary"} className="h-2 w-2 rounded-full p-0" />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {isLive ? 'Live' : 'Idle'}
        </span>
      )}
    </div>
  );
};