import { ScheduleCategory } from "../types/scheduleTypes";
import { FunctionList } from "./FunctionList";
import { FunctionDefinition } from "../types/scheduleTypes";

interface CategorySectionProps {
  category: ScheduleCategory;
  description: string;
  functions: FunctionDefinition[];
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
  schedules: any[];
}

export function CategorySection({ 
  category, 
  description, 
  functions, 
  loading, 
  onExecute, 
  schedules 
}: CategorySectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold capitalize">{category.replace('_', ' ')}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <FunctionList 
        loading={loading} 
        onExecute={onExecute} 
        schedules={schedules}
        functions={functions}
      />
    </div>
  );
}