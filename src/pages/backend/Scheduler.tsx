import { Card } from "@/components/ui/card";
import { ScheduleList } from "./components/schedule/ScheduleList";
import { ExecutionList } from "./components/ExecutionList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { functions } from "@/components/dashboard/utils/functionConfigs";
import { useQuery } from "@tanstack/react-query";

type NewFunctionForm = {
  name: string;
  scheduleType: 'time_based' | 'event_based';
  initialStatus: 'active' | 'paused';
};

export default function BackendScheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);
  const form = useForm<NewFunctionForm>();

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

  // Create default schedule group if none exists
  const ensureDefaultGroup = async () => {
    if (!groups || groups.length === 0) {
      const { error } = await supabase
        .from('schedule_groups')
        .insert([
          { 
            name: 'data-sync',
            description: 'Data synchronization functions'
          },
          {
            name: 'system',
            description: 'System maintenance functions'
          }
        ]);
      
      if (error) {
        console.error('Error creating default groups:', error);
      }
    }
  };

  const onSubmit = async (data: NewFunctionForm) => {
    try {
      console.log("Creating new function schedule:", data);
      await ensureDefaultGroup();
      
      const selectedFunction = functions.find(f => f.function === data.name);
      if (!selectedFunction) {
        throw new Error('Function not found');
      }

      const { data: group } = await supabase
        .from('schedule_groups')
        .select('id')
        .eq('name', selectedFunction.group)
        .single();

      // Create a default time_config based on schedule type
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule Manager</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor function schedules
          </p>
        </div>
        <Dialog open={newFunctionOpen} onOpenChange={setNewFunctionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Function
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Function</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Function Name</label>
                  <Select onValueChange={(value) => form.setValue("name", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select function" />
                    </SelectTrigger>
                    <SelectContent>
                      {functions.map((func) => (
                        <SelectItem key={func.function} value={func.function}>
                          {func.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Schedule Type</label>
                  <Select onValueChange={(value: 'time_based' | 'event_based') => form.setValue("scheduleType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time_based">Time Based</SelectItem>
                      <SelectItem value="event_based">Event Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Status</label>
                  <Select onValueChange={(value: 'active' | 'paused') => form.setValue("initialStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Create Function Schedule
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Function Schedules</h2>
        <ScheduleList />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <ExecutionList />
      </Card>
    </div>
  );
}