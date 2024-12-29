import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PredictionAccuracyChartProps {
  data: any[];
}

export function PredictionAccuracyChart({ data }: PredictionAccuracyChartProps) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-4">Prediction Accuracy</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="predictedUsage.predictedUsage" 
              stroke="#8b5cf6" 
              name="Predicted Usage" 
            />
            <Line 
              type="monotone" 
              dataKey="predictedUsage.confidence" 
              stroke="#10b981" 
              name="Confidence" 
            />
            <Line 
              type="monotone" 
              dataKey="predictedUsage.anomalyScore" 
              stroke="#ef4444" 
              name="Anomaly Score" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}