import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { functions } from "@/components/dashboard/utils/functionConfigs";

interface NewFunctionFormValues {
  name: string;
  scheduleType: 'time_based' | 'event_based';
  initialStatus: 'active' | 'paused';
}

interface NewFunctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewFunctionFormValues) => Promise<void>;
}

export function NewFunctionDialog({ open, onOpenChange, onSubmit }: NewFunctionDialogProps) {
  const form = useForm<NewFunctionFormValues>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Select 
                onValueChange={(value: 'time_based' | 'event_based') => 
                  form.setValue("scheduleType", value)
                }
              >
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
              <Select 
                onValueChange={(value: 'active' | 'paused') => 
                  form.setValue("initialStatus", value)
                }
              >
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
  );
}