import { Schedule } from "@/types/scheduling";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ScheduleSettingsTabProps {
  schedule: Schedule;
  onSave: (updatedSchedule: Partial<Schedule>) => Promise<void>;
}

type ScheduleSettingsForm = {
  timezone: string;
  executionWindow: {
    start_time: string;
    end_time: string;
    days_of_week: number[];
  };
};

export function ScheduleSettingsTab({ schedule, onSave }: ScheduleSettingsTabProps) {
  const form = useForm<ScheduleSettingsForm>({
    defaultValues: {
      timezone: schedule.timezone || "UTC",
      executionWindow: schedule.execution_window || {
        start_time: "00:00",
        end_time: "23:59",
        days_of_week: [1, 2, 3, 4, 5]
      }
    }
  });

  const onSubmit = async (data: ScheduleSettingsForm) => {
    await onSave({
      timezone: data.timezone,
      execution_window: data.executionWindow
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Timezone</label>
          <Select
            value={form.watch("timezone")}
            onValueChange={(value) => form.setValue("timezone", value)}
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

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Execution Window</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                {...form.register("executionWindow.start_time")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                {...form.register("executionWindow.end_time")}
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </Form>
  );
}