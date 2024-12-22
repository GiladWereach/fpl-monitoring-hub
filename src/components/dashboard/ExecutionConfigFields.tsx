import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues, RetryBackoffStrategy } from "./types/scheduling";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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
              <div className="flex items-center gap-2">
                <FormLabel>Allow Concurrent Execution</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enable multiple instances to run simultaneously</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormDescription>
                Multiple instances can run at the same time
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
              <div className="flex items-center gap-2">
                <FormLabel>Retry Count</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of retry attempts on failure</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
              <div className="flex items-center gap-2">
                <FormLabel>Timeout (seconds)</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum execution time before timeout</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
            <div className="flex items-center gap-2">
              <FormLabel>Retry Backoff Strategy</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How to space out retry attempts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-10 sm:h-11">
                  <SelectValue placeholder="Select backoff strategy" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="linear">Linear (Fixed Increase)</SelectItem>
                <SelectItem value="exponential">Exponential (Growing Delay)</SelectItem>
                <SelectItem value="fixed">Fixed (Constant Delay)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {field.value === 'linear' && 'Delay increases by a fixed amount each retry'}
              {field.value === 'exponential' && 'Delay doubles with each retry attempt'}
              {field.value === 'fixed' && 'Same delay between each retry attempt'}
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="execution_config.max_retry_delay"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel>Maximum Retry Delay (seconds)</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximum time to wait between retries</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={3600}
                className="h-10 sm:h-11"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Caps the maximum delay between retries
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}