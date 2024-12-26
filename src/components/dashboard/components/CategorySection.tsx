import { ScheduleCategory } from "../types/scheduleTypes";
import { FunctionDefinition } from "../types/scheduleTypes";
import { Schedule } from "../types/scheduling";
import { FunctionCard } from "./FunctionCard";

interface CategorySectionProps {
  category: ScheduleCategory;
  description: string;
  functions: FunctionDefinition[];
  loading: boolean;
  onExecute: (functionName: string) => Promise<void>;
  schedules: Schedule[];
  matchWindow?: {
    window_start: string;
    window_end: string;
    is_active: boolean;
    match_count: number;
  } | null;
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
  console.log(`Rendering CategorySection for ${category} with ${functions.length} functions`);
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold capitalize mb-1">
          {category.replace('_', ' ')}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {functions.map((func) => {
          const schedule = schedules.find(s => s.function_name === func.function);
          console.log(`Processing function ${func.function}, found schedule:`, schedule);
          
          return (
            <FunctionCard
              key={func.function}
              name={func.name}
              functionName={func.function}
              group={func.group}
              loading={loading}
              onExecute={onExecute}
              schedule={schedule}
              matchWindow={matchWindow}
            />
          );
        })}
      </div>
    </div>
  );
}