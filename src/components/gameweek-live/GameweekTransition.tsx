import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export const GameweekTransition = () => {
  const { data: transitionStatus, isLoading } = useQuery({
    queryKey: ['gameweek-transition'],
    queryFn: async () => {
      console.log('Fetching gameweek transition status...');
      const { data: current, error: currentError } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .single();

      if (currentError) throw currentError;

      const { data: next, error: nextError } = await supabase
        .from('events')
        .select('*')
        .eq('is_next', true)
        .single();

      if (nextError) throw nextError;

      console.log('Transition status:', { current, next });
      return { current, next };
    },
    refetchInterval: (data) => 
      data?.current?.transition_status === 'in_progress' ? 5000 : false
  });

  if (isLoading) {
    return null;
  }

  if (!transitionStatus?.current?.transition_status) {
    return null;
  }

  const getProgress = () => {
    if (!transitionStatus.current.transition_started_at) return 0;
    const start = new Date(transitionStatus.current.transition_started_at).getTime();
    const now = Date.now();
    const duration = 5 * 60 * 1000; // 5 minutes expected duration
    return Math.min(((now - start) / duration) * 100, 100);
  };

  return (
    <Card className="p-6 mb-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Gameweek Transition in Progress
          </h3>
          {transitionStatus.current.transition_status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 text-warning" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Gameweek {transitionStatus.current.id}</span>
            <span>Gameweek {transitionStatus.next.id}</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        {transitionStatus.current.transition_started_at && (
          <p className="text-sm text-muted-foreground">
            Started at: {format(new Date(transitionStatus.current.transition_started_at), 'HH:mm:ss')}
          </p>
        )}

        {transitionStatus.current.transition_error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {transitionStatus.current.transition_error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};