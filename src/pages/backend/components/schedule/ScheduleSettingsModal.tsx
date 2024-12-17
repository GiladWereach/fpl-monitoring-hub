import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScheduleSettingsForm } from "./ScheduleSettingsForm";

interface ScheduleSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId?: string;
}

export function ScheduleSettingsModal({ open, onOpenChange, scheduleId }: ScheduleSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule Settings</DialogTitle>
        </DialogHeader>
        <ScheduleSettingsForm 
          scheduleId={scheduleId} 
          onClose={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}