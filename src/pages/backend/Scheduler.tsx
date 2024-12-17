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
      
      // Map the schedule type to frequency type
      const frequencyType = data.scheduleType === 'time_based' ? 'fixed_interval' : 'match_dependent';
      
      const baseIntervalMinutes = data.scheduleType === 'time_based' ? 5 : null;
      const matchDayIntervalMinutes = data.scheduleType === 'event_based' ? 2 : null;
      const nonMatchIntervalMinutes = data.scheduleType === 'event_based' ? 60 : null;

      const { error } = await supabase
        .from('function_schedules')
        .insert({
          function_name: data.name,
          frequency_type: frequencyType,
          status: data.initialStatus,
          base_interval_minutes: baseIntervalMinutes,
          match_day_interval_minutes: matchDayIntervalMinutes,
          non_match_interval_minutes: nonMatchIntervalMinutes,
          max_concurrent_executions: 3,
          timeout_seconds: 30,
          retry_count: 3,
          retry_delay_seconds: 60
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