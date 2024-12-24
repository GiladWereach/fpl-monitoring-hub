import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface TimeConfigFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function TimeConfigFields({ form }: TimeConfigFieldsProps) {
  console.log("Rendering TimeConfigFields with values:", form.watch("time_config"));

  return (
    <>
      <FormField
        control={form.control}
        name="time_config.type"
        rules={{
          required: "Schedule type is required"
        }}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel>Time Schedule Type</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose how you want to schedule the execution</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select time schedule type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="match_dependent">Match Dependent</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("time_config.type") === "daily" && (
        <FormField
          control={form.control}
          name="time_config.hour"
          rules={{
            required: "Hour is required for daily schedules",
            min: { value: 0, message: "Hour must be between 0 and 23" },
            max: { value: 23, message: "Hour must be between 0 and 23" }
          }}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Hour (UTC)</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hour in 24-hour format (UTC)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>Hour in 24-hour format (UTC)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("time_config.type") === "match_dependent" && (
        <>
          <FormField
            control={form.control}
            name="time_config.matchDayIntervalMinutes"
            rules={{
              required: "Match day interval is required",
              min: { value: 1, message: "Interval must be at least 1 minute" }
            }}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Match Day Interval (minutes)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Interval during active matches</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Interval during active matches (default: 2)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time_config.nonMatchIntervalMinutes"
            rules={{
              required: "Non-match interval is required",
              min: { value: 1, message: "Interval must be at least 1 minute" }
            }}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Non-Match Interval (minutes)</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Interval during live gameweek</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Interval during live gameweek (default: 30)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
}