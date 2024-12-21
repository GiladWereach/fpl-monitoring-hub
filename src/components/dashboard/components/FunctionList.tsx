import { functions } from "../utils/functionConfigs";
import { FunctionCard } from "./FunctionCard";

interface FunctionListProps {
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
  schedules: any[];
}

export function FunctionList({ loading, onExecute, schedules }: FunctionListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {functions.map((func) => {
        const schedule = schedules.find(s => s.function_name === func.function);
        return (
          <FunctionCard
            key={func.function}
            name={func.name}
            functionName={func.function}
            loading={loading}
            onExecute={onExecute}
            schedule={schedule}
          />
        );
      })}
    </div>
  );
}