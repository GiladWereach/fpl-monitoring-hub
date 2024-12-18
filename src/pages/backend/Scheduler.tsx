import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ExecutionList } from "./components/ExecutionList";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ScheduleHeader } from "./components/schedule/ScheduleHeader";
import { ScheduleList } from "./components/schedule/ScheduleList";
import { NewFunctionDialog } from "./components/schedule/NewFunctionDialog";
import { APIHealthStatus } from "@/components/monitoring/APIHealthStatus";

export default function BackendScheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);

  const handleNewFunction = async (data: {
    name: string;
    groupId: string;
  }) => {
    try {
      console.log("Creating new function schedule:", data);
      
      // Get the group's settings
      const { data: group, error: groupError } = await supabase
        .from('function_schedules')
        .select('*')
        .eq('group_id', data.groupId)
        .maybeSingle();

      if (groupError) throw groupError;

      // Use group settings or defaults
      const baseSettings = group || {
        frequency_type: 'fixed_interval',
        base_interval_minutes: 5,
        status: 'paused',
        max_concurrent_executions: 3,
        timeout_seconds: 30,
        retry_count: 3,
        retry_delay_seconds: 60
      };

      const { error } = await supabase
        .from('function_schedules')
        .insert({
          function_name: data.name,
          group_id: data.groupId,
          frequency_type: baseSettings.frequency_type,
          base_interval_minutes: baseSettings.base_interval_minutes,
          status: baseSettings.status,
          max_concurrent_executions: baseSettings.max_concurrent_executions,
          timeout_seconds: baseSettings.timeout_seconds,
          retry_count: baseSettings.retry_count,
          retry_delay_seconds: baseSettings.retry_delay_seconds
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
      
      <APIHealthStatus />

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