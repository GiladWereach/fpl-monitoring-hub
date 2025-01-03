import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId?: string;
}

type ScheduleSettings = {
  runHour: number;
  timezone: string;
  retryCount: number;
  retryInterval: number;
  groupId: string;
  priority: number;
  description: string;
};

export function ScheduleSettingsModal({ open, onOpenChange, scheduleId }: ScheduleSettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");
  const form = useForm<ScheduleSettings>({
    defaultValues: {
      runHour: 0,
      timezone: "UTC",
      retryCount: 3,
      retryInterval: 60,
      priority: 1,
      description: "",
    },
  });

  const onSubmit = async (data: ScheduleSettings) => {
    try {
      console.log("Saving schedule settings:", data);
      const { error } = await supabase
        .from("schedules")
        .update({
          execution_config: {
            retry_count: data.retryCount,
            retry_delay_seconds: data.retryInterval,
          },
          timezone: data.timezone,
        })
        .eq("id", scheduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule settings updated successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule Settings</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="group">Group</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Run Hour (UTC)</label>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      {...form.register("runHour")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <Select
                      onValueChange={(value) => form.setValue("timezone", value)}
                      value={form.watch("timezone")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Retry Count</label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      {...form.register("retryCount")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Retry Interval (seconds)</label>
                    <Input
                      type="number"
                      min={1}
                      {...form.register("retryInterval")}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="group" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority Level</label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    {...form.register("priority")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input {...form.register("description")} />
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Email Notifications</label>
                    <p className="text-sm text-muted-foreground">
                      Receive email alerts for failures
                    </p>
                  </div>
                  <Switch />
                </div>
              </TabsContent>

              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}