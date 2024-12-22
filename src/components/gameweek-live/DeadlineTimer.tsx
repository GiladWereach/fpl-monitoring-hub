import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function DeadlineTimer() {
  const { data: nextDeadline, isLoading } = useQuery({
    queryKey: ['next-deadline'],
    queryFn: async () => {
      console.log('Fetching next deadline...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or('is_next.eq.true,is_current.eq.true')
        .order('deadline_time', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching deadline:', error);
        throw error;
      }

      console.log('Next deadline data:', data);
      return data;
    },
    refetchInterval: (query) => {
      if (!query.state.data) return false;
      const deadline = new Date(query.state.data.deadline_time);
      const now = new Date();
      // Refresh every minute if within 1 hour of deadline
      if (deadline > now && deadline.getTime() - now.getTime() < 60 * 60 * 1000) {
        return 60 * 1000; // 1 minute
      }
      return false;
    }
  });

  if (isLoading) {
    return <div>Loading deadline information...</div>;
  }

  if (!nextDeadline) {
    return null;
  }

  // Parse the deadline_time directly as UTC
  const deadlineTime = new Date(nextDeadline.deadline_time);
  const now = new Date();
  const hasDeadlinePassed = deadlineTime < now;

  console.log('Deadline parsing debug:', {
    rawDeadline: nextDeadline.deadline_time,
    parsedDeadline: deadlineTime.toISOString(),
    formattedTime: format(deadlineTime, 'HH:mm'),
    formattedDate: format(deadlineTime, 'dd MMM yyyy'),
    hasDeadlinePassed,
    currentTime: now.toISOString()
  });

  // Format times in UTC
  const formattedDeadlineTime = format(deadlineTime, 'HH:mm');
  const formattedDeadlineDate = format(deadlineTime, 'dd MMM yyyy');

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        {hasDeadlinePassed ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Deadline passed at {formattedDeadlineTime} UTC on {formattedDeadlineDate}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground">
                Deadline: {formattedDeadlineTime} UTC on {formattedDeadlineDate}
              </p>
              <p className="font-medium">
                Time remaining: {formatDistanceToNowStrict(deadlineTime)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}