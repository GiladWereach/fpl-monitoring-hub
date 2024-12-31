import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { Schedule, TimeConfig } from "@/types/scheduling";

export function ScheduleTable({ schedules }: { schedules: Schedule[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSchedules = schedules?.filter(schedule => {
    const matchesSearch = schedule.function_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "enabled" && schedule.enabled) ||
      (statusFilter === "disabled" && !schedule.enabled);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search functions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Function</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSchedules?.map((schedule) => {
            const timeConfig = schedule.time_config;
            
            return (
              <TableRow key={schedule.id}>
                <TableCell>{schedule.function_name}</TableCell>
                <TableCell>{schedule.schedule_type}</TableCell>
                <TableCell>
                  {schedule.schedule_type === 'time_based' && timeConfig.hour !== undefined && 
                    `Daily at ${timeConfig.hour}:00`
                  }
                  {schedule.schedule_type === 'match_dependent' &&
                    `Match day: ${timeConfig.matchDayIntervalMinutes}m, Other: ${timeConfig.nonMatchIntervalMinutes}m`
                  }
                </TableCell>
                <TableCell>
                  <Badge variant={schedule.enabled ? "success" : "secondary"}>
                    {schedule.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {schedule.last_execution_at ? 
                    format(new Date(schedule.last_execution_at), "MMM d, HH:mm:ss") : 
                    'Never'}
                </TableCell>
                <TableCell>
                  {schedule.next_execution_at ? 
                    format(new Date(schedule.next_execution_at), "MMM d, HH:mm:ss") : 
                    'Not scheduled'}
                </TableCell>
                <TableCell>
                  <QuickActionsMenu
                    scheduleId={schedule.id}
                    status={schedule.enabled}
                    onStatusChange={() => toggleScheduleStatus(schedule.id, schedule.enabled)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
