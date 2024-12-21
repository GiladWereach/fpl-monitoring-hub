import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScheduleFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  groupFilter: string;
  onGroupFilterChange: (value: string) => void;
  groups: string[];
}

export function ScheduleFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  groupFilter,
  onGroupFilterChange,
  groups,
}: ScheduleFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Search functions..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="error">Error</SelectItem>
        </SelectContent>
      </Select>
      <Select value={groupFilter} onValueChange={onGroupFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Groups</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group} value={group || "ungrouped"}>
              {group || "Ungrouped"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}