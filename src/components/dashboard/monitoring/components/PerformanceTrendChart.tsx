import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface PerformanceTrendChartProps {
  data: Array<{
    timestamp: string;
    success_rate: number;
    avg_response_time: number;
    error_count: number;
  }>;
  timeRange: 'hour' | 'day' | 'week';
}

export function PerformanceTrendChart({ data, timeRange }: PerformanceTrendChartProps) {
  console.log('Rendering PerformanceTrendChart with data:', data);

  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
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
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
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
              labelFormatter={(label) => format(new Date(label), 'MM/dd/yyyy HH:mm:ss')}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}