import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues } from "../types/scheduling";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ConcurrencyConfigFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function ConcurrencyConfigFields({ form }: ConcurrencyConfigFieldsProps) {
  return (
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
  );
}