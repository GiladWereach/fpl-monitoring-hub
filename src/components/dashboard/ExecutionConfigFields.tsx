import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues, RetryBackoffStrategy } from "./types/scheduling";

interface ExecutionConfigFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function ExecutionConfigFields({ form }: ExecutionConfigFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Execution Configuration</h3>
      
      <FormField
        control={form.control}
        name="execution_config.concurrent_execution"
        render={({ field }) => (
          <FormItem className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Allow Concurrent Execution</FormLabel>
              <FormDescription>
                Enable multiple instances to run simultaneously
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-2 sm:mt-0"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="execution_config.retry_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Retry Count</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  className="h-10 sm:h-11"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="execution_config.timeout_seconds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeout (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={300}
                  className="h-10 sm:h-11"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="execution_config.retry_backoff"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Retry Backoff Strategy</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11">
                  <SelectValue placeholder="Select backoff strategy" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}