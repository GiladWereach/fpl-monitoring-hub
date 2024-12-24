import { UseFormReturn } from "react-hook-form";
import { AdvancedScheduleFormValues } from "./types/scheduling";
import { RetryConfigFields } from "./execution/RetryConfigFields";
import { TimeoutConfigFields } from "./execution/TimeoutConfigFields";
import { ConcurrencyConfigFields } from "./execution/ConcurrencyConfigFields";

interface ExecutionConfigFieldsProps {
  form: UseFormReturn<AdvancedScheduleFormValues>;
}

export function ExecutionConfigFields({ form }: ExecutionConfigFieldsProps) {
  console.log("Rendering ExecutionConfigFields");
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Execution Configuration</h3>
      
      <ConcurrencyConfigFields form={form} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TimeoutConfigFields form={form} />
      </div>

      <RetryConfigFields form={form} />
    </div>
  );
}