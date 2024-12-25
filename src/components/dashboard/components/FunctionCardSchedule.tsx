import { format } from "date-fns";

interface FunctionCardScheduleProps {
  schedule?: any;
  functionData?: any;
}

export function FunctionCardSchedule({ schedule, functionData }: FunctionCardScheduleProps) {
  if (!schedule) {
    return <div className="italic">No schedule configured</div>;
  }

  return (
    <>
      <div className="flex justify-between">
        <span>Schedule:</span>
        <span>
          {schedule.frequency_type === 'fixed_interval' && 
            `Every ${schedule.base_interval_minutes} minutes`}
          {schedule.frequency_type === 'daily' && 
            `Daily at ${schedule.fixed_time}`}
          {schedule.frequency_type === 'match_dependent' &&
            `Match day: ${schedule.match_day_interval_minutes}m, Other: ${schedule.non_match_interval_minutes}m`}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Last Run:</span>
        <span>
          {functionData?.lastExecution?.completed_at ? 
            format(new Date(functionData.lastExecution.completed_at), "MMM d, HH:mm:ss") : 
            schedule.last_execution_at ? 
              format(new Date(schedule.last_execution_at), "MMM d, HH:mm:ss") : 
              'Never'}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Next Run:</span>
        <span>
          {schedule.next_execution_at ? 
            format(new Date(schedule.next_execution_at), "MMM d, HH:mm:ss") : 
            'Not scheduled'}
        </span>
      </div>
      {functionData?.metrics && (
        <>
          <div className="flex justify-between">
            <span>Success Rate:</span>
            <span>
              {functionData.metrics.total_successes + functionData.metrics.total_errors > 0 
                ? `${Math.round((functionData.metrics.total_successes / (functionData.metrics.total_successes + functionData.metrics.total_errors)) * 100)}%`
                : 'N/A'}
            </span>
          </div>
          {functionData.lastExecution?.error_details && (
            <div className="flex justify-between text-destructive">
              <span>Last Error:</span>
              <span className="truncate max-w-[200px]" title={functionData.lastExecution.error_details}>
                {functionData.lastExecution.error_details}
              </span>
            </div>
          )}
        </>
      )}
    </>
  );
}