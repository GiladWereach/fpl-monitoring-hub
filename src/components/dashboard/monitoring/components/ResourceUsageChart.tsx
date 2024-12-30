import { Card } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

interface ResourceUsageChartProps {
  data: any[];
  chartType?: string;
  showComparison?: boolean;
}

const COLORS = ['#10b981', '#6366f1', '#ef4444', '#f59e0b'];

export function ResourceUsageChart({ 
  data, 
  chartType = 'line',
  showComparison = false 
}: ResourceUsageChartProps) {
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="endpoint" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="success_rate" fill="#10b981" name="Success Rate (%)" />
            <Bar dataKey="avg_response_time" fill="#6366f1" name="Avg Response Time (ms)" />
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey="success_rate"
              nameKey="endpoint"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="endpoint" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="success_rate" 
              stroke="#10b981" 
              name="Success Rate (%)" 
            />
            {showComparison && (
              <Line 
                type="monotone" 
                dataKey="avg_response_time" 
                stroke="#6366f1" 
                name="Avg Response Time (ms)" 
              />
            )}
          </LineChart>
        );
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-4">Resource Usage</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}