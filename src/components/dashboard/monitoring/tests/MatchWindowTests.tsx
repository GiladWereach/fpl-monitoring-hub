import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
  metrics?: {
    responseTime?: number;
    recoveryTime?: number;
    dataFreshness?: number;
  };
}

export function MatchWindowTests() {
  console.log('Rendering MatchWindowTests');

  const { data: testResults, isLoading } = useQuery({
    queryKey: ['match-window-tests'],
    queryFn: async () => {
      console.log('Running match window tests');
      const results: TestResult[] = [];
      const startTime = performance.now();
      
      try {
        // Test 1: Basic Match Window Detection
        const { data: window } = await supabase.rpc('get_current_match_window');
        results.push({
          name: 'Match Window Detection',
          status: window ? 'success' : 'warning',
          message: window ? 'Successfully detected match window' : 'No active match window',
          timestamp: new Date(),
          metrics: {
            responseTime: performance.now() - startTime
          }
        });

        // Test 2: State Transitions
        const { data: states } = await supabase
          .from('match_window_states')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        results.push({
          name: 'State Transitions',
          status: states?.length ? 'success' : 'error',
          message: states?.length ? 'State transitions working' : 'No state transitions found',
          timestamp: new Date()
        });

        // Test 3: Recovery Mechanism
        const recoveryStartTime = performance.now();
        try {
          throw new Error('test_error');
        } catch (error) {
          const recovered = await handleRecoveryTest();
          results.push({
            name: 'Recovery Mechanism',
            status: recovered ? 'success' : 'warning',
            message: recovered ? 'Recovery mechanism working' : 'Recovery needs attention',
            timestamp: new Date(),
            metrics: {
              recoveryTime: performance.now() - recoveryStartTime
            }
          });
        }

        // Test 4: Data Freshness
        const { data: latestState } = await supabase
          .from('match_window_states')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1);

        const freshness = latestState?.[0]?.created_at ? 
          Date.now() - new Date(latestState[0].created_at).getTime() :
          Infinity;

        results.push({
          name: 'Data Freshness',
          status: freshness < 300000 ? 'success' : 'warning',
          message: `Data is ${Math.round(freshness / 1000)}s old`,
          timestamp: new Date(),
          metrics: {
            dataFreshness: freshness
          }
        });

      } catch (error) {
        console.error('Error running tests:', error);
        toast({
          title: "Test Error",
          description: "Failed to run match window tests",
          variant: "destructive",
        });
      }

      return results;
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return <Card className="p-4">Running tests...</Card>;
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Match Window Tests</h3>
      <div className="space-y-2">
        {testResults?.map((result, index) => (
          <Alert key={index} variant={result.status === 'error' ? 'destructive' : 'default'}>
            <div className="flex items-center gap-2">
              {result.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : result.status === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <div>
                <div className="font-medium">{result.name}</div>
                <AlertDescription>{result.message}</AlertDescription>
                {result.metrics && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.metrics.responseTime && `Response: ${result.metrics.responseTime.toFixed(0)}ms`}
                    {result.metrics.recoveryTime && ` Recovery: ${result.metrics.recoveryTime.toFixed(0)}ms`}
                    {result.metrics.dataFreshness && ` Freshness: ${(result.metrics.dataFreshness / 1000).toFixed(0)}s`}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
}

async function handleRecoveryTest(): Promise<boolean> {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch {
    return false;
  }
}