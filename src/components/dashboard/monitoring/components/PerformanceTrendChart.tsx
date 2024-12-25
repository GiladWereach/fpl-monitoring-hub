import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from "@/components/ui/card";
import { format, isValid, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PerformanceTrendChartProps {
  data: Array<{
    timestamp: string;
    success_rate: number;
    avg_response_time: number;
    error_count: number;
    recovery_rate?: number;
  }>;
  timeRange: 'hour' | 'day' | 'week';
}

export function PerformanceTrendChart({ data, timeRange }: PerformanceTrendChartProps) {
  console.log('Rendering PerformanceTrendChart with data:', data);

  const formatXAxis = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      if (!isValid(date)) {
        console.warn('Invalid date:', timestamp);
        return 'Invalid Date';
      }
      
      switch (timeRange) {
        case 'hour':
          return format(date, 'HH:mm');
        case 'day':
          return format(date, 'HH:mm');
        case 'week':
          return format(date, 'MM/dd');
        default:
          return format(date, 'MM/dd HH:mm');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Performance</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="show-errors" defaultChecked />
            <Label htmlFor="show-errors">Show Errors</Label>
          </div>
          <Select defaultValue={timeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(label) => {
                try {
                  const date = parseISO(label);
                  return isValid(date) ? format(date, 'MM/dd/yyyy HH:mm:ss') : 'Invalid Date';
                } catch (error) {
                  console.error('Error formatting tooltip date:', error);
                  return 'Invalid Date';
                }
              }}
              formatter={(value: number) => [value.toFixed(2), '']}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="success_rate"
              stroke="#10b981"
              name="Success Rate (%)"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avg_response_time"
              stroke="#6366f1"
              name="Avg Response Time (ms)"
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="error_count"
              stroke="#ef4444"
              name="Error Count"
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="recovery_rate"
              stroke="#f59e0b"
              name="Recovery Rate (%)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}