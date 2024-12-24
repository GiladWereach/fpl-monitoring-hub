import { Schedule } from "@/types/scheduling";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ErrorHandlingTabProps {
  schedule: Schedule;
  onSave: (updatedSchedule: Partial<Schedule>) => Promise<void>;
}

type ErrorHandlingForm = {
  retry_count: number;
  retry_delay_seconds: number;
  retry_backoff: 'linear' | 'exponential' | 'fixed';
  max_retry_delay: number;
  alert_on_failure: boolean;
  alert_on_recovery: boolean;
  failure_threshold: number;
  auto_disable_after_failures: boolean;
};

export function ErrorHandlingTab({ schedule, onSave }: ErrorHandlingTabProps) {
  console.log('Rendering ErrorHandlingTab with schedule:', schedule);

  const form = useForm<ErrorHandlingForm>({
    defaultValues: {
      retry_count: schedule.execution_config.retry_count,
      retry_delay_seconds: schedule.execution_config.retry_delay_seconds,
      retry_backoff: schedule.execution_config.retry_backoff,
      max_retry_delay: schedule.execution_config.max_retry_delay,
      alert_on_failure: schedule.execution_config.alert_on_failure ?? true,
      alert_on_recovery: schedule.execution_config.alert_on_recovery ?? true,
      failure_threshold: schedule.execution_config.failure_threshold ?? 3,
      auto_disable_after_failures: schedule.execution_config.auto_disable_after_failures ?? false
    }
  });

  const onSubmit = async (data: ErrorHandlingForm) => {
    console.log('Submitting error handling configuration:', data);
    try {
      await onSave({
        execution_config: {
          ...schedule.execution_config,
          ...data
        }
      });
      
      toast({
        title: "Settings Updated",
        description: "Error handling configuration has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving error handling configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save error handling configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Retry Count</Label>
            <Input
              type="number"
              min={0}
              max={10}
              {...form.register("retry_count", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label>Retry Delay (seconds)</Label>
            <Input
              type="number"
              min={1}
              {...form.register("retry_delay_seconds", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Retry Backoff Strategy</Label>
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
          <Label>Max Retry Delay (seconds)</Label>
          <Input
            type="number"
            min={1}
            {...form.register("max_retry_delay", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alert on Failure</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications when execution fails
              </p>
            </div>
            <Switch
              checked={form.watch("alert_on_failure")}
              onCheckedChange={(checked) => form.setValue("alert_on_failure", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alert on Recovery</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications when execution recovers
              </p>
            </div>
            <Switch
              checked={form.watch("alert_on_recovery")}
              onCheckedChange={(checked) => form.setValue("alert_on_recovery", checked)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Failure Threshold</Label>
            <Input
              type="number"
              min={1}
              {...form.register("failure_threshold", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">
              Number of consecutive failures before taking action
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-disable After Failures</Label>
              <p className="text-sm text-muted-foreground">
                Automatically disable schedule after threshold is reached
              </p>
            </div>
            <Switch
              checked={form.watch("auto_disable_after_failures")}
              onCheckedChange={(checked) => form.setValue("auto_disable_after_failures", checked)}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </Form>
  );
}