import { functions } from "../utils/functionConfigs";
import { FunctionCard } from "./FunctionCard";

interface FunctionListProps {
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
}

export function FunctionList({ loading, onExecute }: FunctionListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {functions.map((func) => (
        <FunctionCard
          key={func.function}
          name={func.name}
          functionName={func.function}
          loading={loading}
          onExecute={onExecute}
        />
      ))}
    </div>
  );
}