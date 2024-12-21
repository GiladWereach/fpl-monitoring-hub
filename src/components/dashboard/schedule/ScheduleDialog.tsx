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
}

export function ScheduleDialog({ 
  functionName, 
  functionDisplayName,
  currentSchedule 
}: ScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const { form, onSubmit } = useScheduleForm({
    functionName,
    onSuccess: () => setOpen(false),
  });

  const isDataCollectionFunction = 
    functionName === 'fetch-live-gameweek' || 
    functionName === 'fetch-fixtures';

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
            {isDataCollectionFunction && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Auto-managed based on match timings)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto">
          <ScheduleForm 
            form={form} 
            onSubmit={onSubmit}
            isDataCollectionFunction={isDataCollectionFunction}
          />
          <ExecutionHistory functionName={functionName} />
        </div>
      </DialogContent>
    </Dialog>
  );
}