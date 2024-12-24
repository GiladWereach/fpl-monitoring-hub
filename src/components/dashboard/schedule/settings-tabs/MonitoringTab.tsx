import { Schedule } from "@/types/scheduling";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorAnalyticsDashboard } from "../../monitoring/ErrorAnalyticsDashboard";
import { useQuery } from "@tanstack/react-query";
import { errorPatternService } from "@/services/errorPatternService";
import { toast } from "@/hooks/use-toast";

interface MonitoringTabProps {
  schedule: Schedule;
}

export function MonitoringTab({ schedule }: MonitoringTabProps) {
  console.log('Rendering MonitoringTab for schedule:', schedule.function_name);

  const { data: errorPatterns, isLoading } = useQuery({
    queryKey: ['error-patterns', schedule.id],
    queryFn: () => errorPatternService.analyzePatterns(),
    refetchInterval: 60000,
    meta: {
      onError: () => {
        toast({
          title: "Error Analysis Failed",
          description: "Could not analyze error patterns",
          variant: "destructive",
        });
      }
    }
  });

  return (
    <Card className="p-6">
      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="patterns">Error Patterns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics">
          <ErrorAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="patterns">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detected Error Patterns</h3>
            {isLoading ? (
              <p>Analyzing patterns...</p>
            ) : errorPatterns?.length === 0 ? (
              <p>No error patterns detected</p>
            ) : (
              <div className="grid gap-4">
                {errorPatterns?.map(pattern => (
                  <Card key={pattern.pattern_id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{pattern.error_type}</h4>
                        <p className="text-sm text-muted-foreground">
                          Frequency: {pattern.frequency.toFixed(2)} errors/hour
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-sm ${
                        pattern.severity === 'high' ? 'bg-red-100 text-red-800' :
                        pattern.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {pattern.severity}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      First seen: {pattern.first_seen.toLocaleString()}
                      <br />
                      Last seen: {pattern.last_seen.toLocaleString()}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}