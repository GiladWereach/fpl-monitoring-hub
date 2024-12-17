import { Schedule } from "@/types/scheduling";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ErrorHandlingTabProps {
  schedule: Schedule;
  onSave: (updatedSchedule: Partial<Schedule>) => Promise<void>;
}

type ErrorHandlingForm = {
  retry_count: number;
  retry_delay_seconds: number;
  retry_backoff: 'linear' | 'exponential' | 'fixed';
  max_retry_delay: number;
};

export function ErrorHandlingTab({ schedule, onSave }: ErrorHandlingTabProps) {
  const form = useForm<ErrorHandlingForm>({
    defaultValues: {
      retry_count: schedule.execution_config.retry_count,
      retry_delay_seconds: schedule.execution_config.retry_delay_seconds,
      retry_backoff: schedule.execution_config.retry_backoff,
      max_retry_delay: schedule.execution_config.max_retry_delay
    }
  });

  const onSubmit = async (data: ErrorHandlingForm) => {
    await onSave({
      execution_config: {
        ...schedule.execution_config,
        ...data
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Retry Count</label>
            <Input
              type="number"
              min={0}
              max={10}
              {...form.register("retry_count", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Retry Delay (seconds)</label>
            <Input
              type="number"
              min={1}
              {...form.register("retry_delay_seconds", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Retry Backoff Strategy</label>
          <Select
            value={form.watch("retry_backoff")}
            onValueChange={(value: 'linear' | 'exponential' | 'fixed') => 
              form.setValue("retry_backoff", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="exponential">Exponential</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Max Retry Delay (seconds)</label>
          <Input
            type="number"
            min={1}
            {...form.register("max_retry_delay", { valueAsNumber: true })}
          />
        </div>

        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </Form>
  );
}