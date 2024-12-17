import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScheduleList } from "./components/ScheduleList";
import { ExecutionList } from "./components/ExecutionList";

export default function BackendScheduler() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule Manager</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor function schedules
        </p>
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