import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { validateSchedule } from "@/services/scheduleValidationService";
import { AdvancedScheduleFormValues } from "../types/scheduling";
import { TimeConfigFields } from "../TimeConfigFields";
import { ExecutionConfigFields } from "../ExecutionConfigFields";
import { EventConditionsFields } from "../EventConditionsFields";
import { UseFormReturn } from "react-hook-form";

interface ScheduleFormProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
  onSubmit: (data: AdvancedScheduleFormValues) => Promise<void>;
  isDataCollectionFunction?: boolean;
  isCoreDataFunction?: boolean;
}

export function ScheduleForm({ 
  form, 
  onSubmit,
  isDataCollectionFunction,
  isCoreDataFunction 
}: ScheduleFormProps) {
  const handleSubmit = async (data: AdvancedScheduleFormValues) => {
    console.log('Validating schedule before submission:', data);
    
    try {
      const validationResult = await validateSchedule(data);
      
      if (!validationResult.isValid) {
        validationResult.errors.forEach(error => {
          toast({
            title: "Validation Error",
            description: error,
            variant: "destructive",
          });
        });
        return;
      }

      if (validationResult.warnings.length > 0) {
        validationResult.warnings.forEach(warning => {
          toast({
            title: "Warning",
            description: warning,
          });
        });
      }

      onSubmit(data);
    } catch (error) {
      console.error('Error validating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to validate schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <TimeConfigFields form={form} />
        <ExecutionConfigFields form={form} />
        <EventConditionsFields form={form} />
        
        <div className="flex justify-end">
          <Button type="submit">
            Save Schedule
          </Button>
        </div>
      </form>
    </Form>
  );
}