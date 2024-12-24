import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";

interface ExecutionLogFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export function ExecutionLogFilters({
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
}: ExecutionLogFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="running">Running</SelectItem>
        </SelectContent>
      </Select>

      <DatePickerWithRange
        date={dateRange}
        onDateChange={onDateRangeChange}
      />
    </div>
  );
}