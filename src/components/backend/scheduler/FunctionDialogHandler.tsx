import React, { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NewFunctionDialog } from "@/pages/backend/components/schedule/NewFunctionDialog";

interface FunctionDialogHandlerProps {
  newFunctionOpen: boolean;
  setNewFunctionOpen: (open: boolean) => void;
}

export function FunctionDialogHandler({ 
  newFunctionOpen, 
  setNewFunctionOpen 
}: FunctionDialogHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleNewFunction = async (data: {
    name: string;
    groupId: string;
  }) => {
    setIsLoading(true);
    try {
      console.log("Creating new function schedule:", data);
      
      // Get base settings from existing schedule if any
      const { data: existingSchedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('function_name', data.name)
        .maybeSingle();

      if (scheduleError) throw scheduleError;

      // Default settings if no existing schedule
      const baseSettings = existingSchedule || {
        schedule_type: 'time_based',
        time_config: {
          type: 'interval',
          intervalMinutes: 5
        },
        enabled: false,
        execution_config: {
          retry_count: 3,
          timeout_seconds: 30,
          retry_delay_seconds: 60,
          concurrent_execution: false,
          retry_backoff: 'linear',
          max_retry_delay: 3600
        }
      };

      const { error } = await supabase
        .from('schedules')
        .insert({
          function_name: data.name,
          schedule_type: baseSettings.schedule_type,
          enabled: baseSettings.enabled,
          time_config: baseSettings.time_config,
          execution_config: baseSettings.execution_config,
          timezone: 'UTC'
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
        description: error instanceof Error ? error.message : "Failed to create function schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NewFunctionDialog
      open={newFunctionOpen}
      onOpenChange={setNewFunctionOpen}
      onSubmit={handleNewFunction}
      isLoading={isLoading}
    />
  );
}