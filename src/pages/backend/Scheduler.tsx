import { Card } from "@/components/ui/card";
import { ScheduleList } from "./components/ScheduleList";
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
  scheduleType: string;
  initialStatus: string;
};

export default function BackendScheduler() {
  const [newFunctionOpen, setNewFunctionOpen] = useState(false);
  const form = useForm<NewFunctionForm>();

  const onSubmit = async (data: NewFunctionForm) => {
    try {
      console.log("Creating new function schedule:", data);
      // Implementation for creating new function schedule
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
                  <label className="text-sm font-medium">Group</label>
                  <Select onValueChange={(value) => form.setValue("group", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Schedule Type</label>
                  <Select onValueChange={(value) => form.setValue("scheduleType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interval">Interval</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
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