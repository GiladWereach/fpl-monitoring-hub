import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ExecutionList } from "./components/ExecutionList";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScheduleHeader } from "./components/schedule/ScheduleHeader";
import { ScheduleList } from "./components/schedule/ScheduleList";
import { NewFunctionDialog } from "./components/schedule/NewFunctionDialog";

export default function BackendScheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);

  // Query to get schedule groups
  const { data: groups } = useQuery({
    queryKey: ['schedule-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_groups')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const handleNewFunction = async (data: {
    name: string;
    scheduleType: 'time_based' | 'event_based';
    initialStatus: 'active' | 'paused';
  }) => {
    try {
      console.log("Creating new function schedule:", data);
      
      const timeConfig = data.scheduleType === 'time_based' ? {
        type: 'interval',
        intervalMinutes: 5,
        hour: 0
      } : null;

      const eventConfig = data.scheduleType === 'event_based' ? {
        triggerType: 'deadline',
        offsetMinutes: 0
      } : null;

      const { error } = await supabase
        .from('schedules')
        .insert({
          function_name: data.name,
          schedule_type: data.scheduleType,
          enabled: data.initialStatus === 'active',
          time_config: timeConfig,
          event_config: eventConfig,
          execution_config: {
            retry_count: 3,
            retry_delay_seconds: 60,
            concurrent_execution: false,
            retry_backoff: 'linear',
            max_retry_delay: 3600
          }
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New function schedule created",
      });
      setNewFunctionOpen(false);
    } catch (error) {
      console.error("Error creating function schedule:", error);
      toast({
        title: "Error",
        description: "Failed to create function schedule",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ScheduleHeader onNewFunction={() => setNewFunctionOpen(true)} />

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Function Schedules</h2>
        <ScheduleList />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <ExecutionList />
      </Card>

      <NewFunctionDialog
        open={newFunctionOpen}
        onOpenChange={setNewFunctionOpen}
        onSubmit={handleNewFunction}
      />
    </div>
  );
}