import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";
import { useState } from "react";
import { ScheduleForm } from "./ScheduleForm";
import { ExecutionHistory } from "../ExecutionHistory";
import { useScheduleForm } from "./useScheduleForm";

interface ScheduleDialogProps {
  functionName: string;
  functionDisplayName: string;
  currentSchedule?: any;
  isCoreDataFunction?: boolean;
  isMatchDependentFunction?: boolean;
}

export function ScheduleDialog({ 
  functionName, 
  functionDisplayName,
  currentSchedule,
  isCoreDataFunction,
  isMatchDependentFunction
}: ScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const { form, onSubmit } = useScheduleForm({
    functionName,
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="md:w-auto">
          <Timer className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Schedule</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-[95vw] md:w-auto">
        <DialogHeader>
          <DialogTitle>
            Schedule {functionDisplayName}
            {isMatchDependentFunction && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Auto-managed based on match timings)
              </span>
            )}
            {isCoreDataFunction && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Daily Core Data Collection - 3 AM UTC)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto">
          <ScheduleForm 
            form={form} 
            onSubmit={onSubmit}
            isDataCollectionFunction={isMatchDependentFunction}
            isCoreDataFunction={isCoreDataFunction}
          />
          <ExecutionHistory functionName={functionName} />
        </div>
      </DialogContent>
    </Dialog>
  );
}