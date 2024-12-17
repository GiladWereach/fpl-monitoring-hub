import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Play, Pause, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export function ScheduleList() {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['function-schedules'],
    queryFn: async () => {
      console.log('Fetching function schedules');
      const { data, error } = await supabase
        .from('function_schedules')
        .select(`
          *,
          schedule_groups (
            name,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching schedules:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 30000
  });

  const toggleScheduleStatus = async (scheduleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('function_schedules')
        .update({ status: newStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Schedule ${newStatus === 'active' ? 'activated' : 'paused'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Group</TableHead>
          <TableHead>Function</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Run</TableHead>
          <TableHead>Next Run</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules?.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>
              {schedule.schedule_groups?.name || 'Ungrouped'}
            </TableCell>
            <TableCell>{schedule.function_name}</TableCell>
            <TableCell>
              {schedule.frequency_type === 'fixed_interval' && 
                `Every ${schedule.base_interval_minutes} minutes`}
              {schedule.frequency_type === 'daily' && 
                `Daily at ${schedule.fixed_time}`}
              {schedule.frequency_type === 'match_dependent' &&
                `Match day: ${schedule.match_day_interval_minutes}m, Other: ${schedule.non_match_interval_minutes}m`}
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(schedule.status)}>
                {schedule.status}
              </Badge>
            </TableCell>
            <TableCell>
              {schedule.last_execution_at ? 
                format(new Date(schedule.last_execution_at), "MMM d, HH:mm:ss") : 
                'Never'}
            </TableCell>
            <TableCell>
              {schedule.next_execution_at ? 
                format(new Date(schedule.next_execution_at), "MMM d, HH:mm:ss") : 
                'Not scheduled'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleScheduleStatus(schedule.id, schedule.status)}
                >
                  {schedule.status === 'active' ? 
                    <Pause className="h-4 w-4" /> : 
                    <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}