import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { ScheduleDialog } from "./schedule/ScheduleDialog";

interface ScheduleManagerProps {
  functionName: string;
  functionDisplayName: string;
}

export function ScheduleManager({ functionName, functionDisplayName }: ScheduleManagerProps) {
  return <ScheduleDialog functionName={functionName} functionDisplayName={functionDisplayName} />;
}