import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Play, Calendar } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BackendSidebarMenu } from "@/components/backend/navigation/BackendSidebarMenu";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function BackendLogs() {
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: executionLogs, isLoading } = useQuery({
    queryKey: ["execution-logs"],
    queryFn: async () => {
      console.log("Fetching execution logs");
      const { data: logs, error } = await supabase
        .from("schedule_execution_logs")
        .select(`
          *,
          schedules (
            function_name,
            schedule_type
          )
        `)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching execution logs:", error);
        throw error;
      }

      console.log("Execution logs:", logs);
      return logs;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getExecutionDuration = (log: any) => {
    if (!log.completed_at) return "In Progress...";
    return `${log.execution_duration_ms}ms`;
  };

  const getExecutionIcon = (log: any) => {
    if (!log.completed_at) return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
    return log.status === "completed" ? (
      <CheckCircle2 className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  const getTriggerIcon = (log: any) => {
    return log.schedules?.schedule_type === "time_based" ? (
      <Calendar className="h-4 w-4 text-muted-foreground" />
    ) : (
      <Play className="h-4 w-4 text-muted-foreground" />
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider defaultOpen>
        <BackendSidebarMenu onExpandedChange={setIsExpanded} />
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out p-6",
        )}>
          <div className={cn(
            "space-y-6",
            "max-w-7xl",
            isExpanded ? "ml-[240px]" : "ml-[60px]"
          )}>
            <div className="container mx-auto p-4 space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Edge Function Logs</h1>
                <p className="text-muted-foreground mt-1">
                  View execution history of edge functions
                </p>
              </div>

              <Card className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Function</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Started At</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executionLogs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getExecutionIcon(log)}
                              <span className="capitalize">{log.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>{log.schedules?.function_name || "Unknown"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTriggerIcon(log)}
                              <span className="capitalize">
                                {log.schedules?.schedule_type === "time_based" ? "Scheduled" : "Manual"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.started_at), "MMM d, yyyy HH:mm:ss")}
                          </TableCell>
                          <TableCell>{getExecutionDuration(log)}</TableCell>
                          <TableCell>
                            {log.error_details ? (
                              <span className="text-destructive">{log.error_details}</span>
                            ) : (
                              <span className="text-muted-foreground">No errors</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
