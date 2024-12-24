import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ErrorMetrics } from '../types/error-analytics';
import { analyzeErrorPatterns } from '../utils/errorMetricsProcessor';

interface ErrorAnalyticsSummaryProps {
  metrics: ErrorMetrics[];
}

export function ErrorAnalyticsSummary({ metrics }: ErrorAnalyticsSummaryProps) {
  console.log('Rendering ErrorAnalyticsSummary with metrics:', metrics);
  
  const analysis = analyzeErrorPatterns(metrics);
  
  const getTrendIcon = () => {
    switch (analysis.trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Health Analysis</h3>
        {getTrendIcon()}
      </div>
      
      <Alert variant={analysis.severity === 'high' ? 'destructive' : 'default'}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>System Health: {analysis.severity.toUpperCase()}</AlertTitle>
        <AlertDescription>
          Error patterns are {analysis.trend}
        </AlertDescription>
      </Alert>
      
      {analysis.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Recommendations:</h4>
          <ul className="list-disc pl-4 space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-muted-foreground">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}