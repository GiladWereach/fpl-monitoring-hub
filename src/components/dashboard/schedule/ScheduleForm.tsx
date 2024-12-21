import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormFields } from "../ScheduleFormFields";
import { AdvancedScheduleFormValues } from "../types/scheduling";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ScheduleFormProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
  onSubmit: (values: AdvancedScheduleFormValues) => Promise<void>;
  isDataCollectionFunction?: boolean;
}

export function ScheduleForm({ form, onSubmit, isDataCollectionFunction }: ScheduleFormProps) {
  if (isDataCollectionFunction) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          This function's schedule is automatically managed based on match timings:
          <ul className="list-disc list-inside mt-2">
            <li>During matches: Updates every 2 minutes</li>
            <li>During live gameweek: Updates every 30 minutes</li>
            <li>Outside gameweek: Updates once daily</li>
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScheduleFormFields form={form} />
        <Button type="submit" className="w-full">
          Save Schedule
        </Button>
      </form>
    </Form>
  );
}