import React from 'react';
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
  const handleNewFunction = async (data: {
    name: string;
    groupId: string;
  }) => {
    try {
      console.log("Creating new function schedule:", data);
      
      const { data: group, error: groupError } = await supabase
        .from('function_schedules')
        .select('*')
        .eq('group_id', data.groupId)
        .maybeSingle();

      if (groupError) throw groupError;

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
    <NewFunctionDialog
      open={newFunctionOpen}
      onOpenChange={setNewFunctionOpen}
      onSubmit={handleNewFunction}
    />
  );
}