import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Schedule } from "../types/scheduling";
import { RefreshCw } from "lucide-react";

interface FunctionCardProps {
  name: string;
  functionName: string;
  group?: string;
  loading: string | null;
  onExecute: (functionName: string) => Promise<void>;
  schedule?: Schedule;
  matchWindow?: {
    window_start: string;
    window_end: string;
    is_active: boolean;
    match_count: number;
  } | null;
}

export function FunctionCard({
  name,
  functionName,
  group,
  loading,
  onExecute,
  schedule,
  matchWindow
}: FunctionCardProps) {
  const isLoading = loading === functionName;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{name}</CardTitle>
        {group && (
          <p className="text-sm text-muted-foreground">{group}</p>
        )}
      </CardHeader>
      <CardContent>
        {schedule && (
          <div className="text-sm space-y-2">
            <p>Last run: {schedule.last_execution_at || 'Never'}</p>
            <p>Next run: {schedule.next_execution_at || 'Not scheduled'}</p>
            <p>Status: {schedule.enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onExecute(functionName)}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Execute Now
        </Button>
      </CardFooter>
    </Card>
  );
}