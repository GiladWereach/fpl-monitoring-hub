import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormFields } from "../ScheduleFormFields";
import { AdvancedScheduleFormValues } from "../types/scheduling";

interface ScheduleFormProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
  onSubmit: (values: AdvancedScheduleFormValues) => Promise<void>;
}

export function ScheduleForm({ form, onSubmit }: ScheduleFormProps) {
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