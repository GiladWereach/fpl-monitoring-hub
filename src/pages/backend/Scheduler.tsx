import { Card } from "@/components/ui/card";
import { ScheduleList } from "./components/schedule/ScheduleList";
import { ExecutionList } from "./components/ExecutionList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type NewFunctionForm = {
  name: string;
  group: string;
  scheduleType: 'time_based' | 'event_based';
  initialStatus: 'active' | 'paused';
};

export default function BackendScheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);
  const form = useForm<NewFunctionForm>();

  const onSubmit = async (data: NewFunctionForm) => {
    try {
      console.log("Creating new function schedule:", data);
      const { error } = await supabase
        .from('schedules')
        .insert({
          function_name: data.name,
          schedule_type: data.scheduleType,
          enabled: data.initialStatus === 'active',
          execution_config: {
            retry_count: 3,
            retry_delay_seconds: 60,
            priority: 1,
            concurrent_execution: false
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
                  <Input {...form.register("name")} />
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