import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ExecutionLogSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ExecutionLogSearch({ searchTerm, onSearchChange }: ExecutionLogSearchProps) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search executions..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}