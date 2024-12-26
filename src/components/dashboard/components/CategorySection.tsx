import { ScheduleCategory } from "../types/scheduleTypes";
import { FunctionDefinition } from "../types/scheduleTypes";
import { FunctionList } from "./FunctionList";
import { MatchWindow } from "@/services/matchWindowService";

interface CategorySectionProps {
  category: ScheduleCategory;
  description: string;
  functions: FunctionDefinition[];
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
  schedules: any[];
  matchWindow?: MatchWindow; // Made optional to maintain backward compatibility
}

export function CategorySection({
  category,
  description,
  functions,
  loading,
  onExecute,
  schedules,
  matchWindow
}: CategorySectionProps) {
  return (
    <div className="space-y-4">
      <div>
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