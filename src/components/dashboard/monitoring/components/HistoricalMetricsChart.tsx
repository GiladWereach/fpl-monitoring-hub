import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoricalMetric {
  timestamp: string;
  value: number;
  threshold: number;
}

interface HistoricalMetricsChartProps {
  data: HistoricalMetric[];
  metricName: string;
}

export function HistoricalMetricsChart({ data, metricName }: HistoricalMetricsChartProps) {
  console.log('Rendering HistoricalMetricsChart with:', { metricName, dataPoints: data.length });
  
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{metricName} - Historical Trend</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              name="Value"
            />
            <Line 
              type="monotone" 
              dataKey="threshold" 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              name="Threshold"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}