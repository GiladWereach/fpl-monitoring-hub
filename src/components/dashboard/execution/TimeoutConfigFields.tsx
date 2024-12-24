import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues } from "../types/scheduling";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface TimeoutConfigFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function TimeoutConfigFields({ form }: TimeoutConfigFieldsProps) {
  return (
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
  );
}