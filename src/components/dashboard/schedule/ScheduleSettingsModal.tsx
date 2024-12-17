import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsTab } from "./settings-tabs/GeneralSettingsTab";
import { ScheduleSettingsTab } from "./settings-tabs/ScheduleSettingsTab";
import { ErrorHandlingTab } from "./settings-tabs/ErrorHandlingTab";
import { MonitoringTab } from "./settings-tabs/MonitoringTab";
import { Schedule } from "@/types/scheduling";
import { useState } from "react";

interface ScheduleSettingsModalProps {
  schedule: Schedule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedSchedule: Partial<Schedule>) => Promise<void>;
}

export function ScheduleSettingsModal({
  schedule,
  open,
  onOpenChange,
  onSave
}: ScheduleSettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Schedule Settings - {schedule.function_name}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="error-handling">Error Handling</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralSettingsTab schedule={schedule} onSave={onSave} />
          </TabsContent>
          <TabsContent value="schedule">
            <ScheduleSettingsTab schedule={schedule} onSave={onSave} />
          </TabsContent>
          <TabsContent value="error-handling">
            <ErrorHandlingTab schedule={schedule} onSave={onSave} />
          </TabsContent>
          <TabsContent value="monitoring">
            <MonitoringTab schedule={schedule} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}