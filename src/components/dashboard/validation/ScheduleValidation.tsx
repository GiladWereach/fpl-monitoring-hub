import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ValidationResult {
  schedule_id: string;
  function_name: string;
  status: 'valid' | 'warning' | 'invalid';
  issues: string[];
}

export function ScheduleValidation() {
  const { data: validations } = useQuery({
    queryKey: ['schedule-validations'],
    queryFn: async () => {
      console.log('Fetching schedule validations');
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      const results: ValidationResult[] = [];
      
      for (const schedule of schedules) {
        const issues = [];
        
        // Validate time config
        if (schedule.schedule_type === 'time_based' && !schedule.time_config) {
          issues.push('Missing time configuration');
        }
        
        // Validate execution window
        if (schedule.execution_window && 
            (!schedule.execution_window.start_time || !schedule.execution_window.end_time)) {
          issues.push('Invalid execution window');
        }
        
        // Validate execution config
        if (!schedule.execution_config?.retry_count || 
            !schedule.execution_config?.timeout_seconds) {
          issues.push('Incomplete execution configuration');
        }

        results.push({
          schedule_id: schedule.id,
          function_name: schedule.function_name,
          status: issues.length === 0 ? 'valid' : 
                 issues.length < 2 ? 'warning' : 'invalid',
          issues
        });
      }

      return results;
    },
    refetchInterval: 60000
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Schedule Validation</h3>
      
      <div className="space-y-4">
        {validations?.map((validation) => (
          <Card key={validation.schedule_id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(validation.status)}
                <div>
                  <p className="font-medium">{validation.function_name}</p>
                  {validation.issues.length > 0 && (
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {validation.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <Badge
                variant={validation.status === 'valid' ? 'default' : 
                        validation.status === 'warning' ? 'warning' : 'destructive'}
              >
                {validation.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}