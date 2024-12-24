import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ErrorMetrics } from '../types/error-analytics';

interface ErrorMetricsChartProps {
  data: ErrorMetrics[];
}

export function ErrorMetricsChart({ data }: ErrorMetricsChartProps) {
  console.log('Rendering ErrorMetricsChart with data:', data);
  
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="error_count" 
            stroke="#ef4444" 
            name="Errors" 
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="recovery_rate" 
            stroke="#22c55e" 
            name="Recovery Rate %" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}