import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ResourceUsageChartProps {
  data: any[];
}

export function ResourceUsageChart({ data }: ResourceUsageChartProps) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-4">Resource Usage Trends</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="activeTasks" 
              stackId="1"
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3}
              name="Active Tasks" 
            />
            <Area 
              type="monotone" 
              dataKey="requestRate" 
              stackId="2"
              stroke="#f59e0b" 
              fill="#f59e0b"
              fillOpacity={0.3}
              name="Request Rate" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}