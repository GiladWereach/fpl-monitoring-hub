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
}

export function MatchWindowTests() {
  console.log('Rendering MatchWindowTests');

  const { data: testResults, isLoading } = useQuery({
    queryKey: ['match-window-tests'],
    queryFn: async () => {
      console.log('Running match window tests');
      const results: TestResult[] = [];
      
      try {
        // Test 1: Match Window Detection
        const { data: window } = await supabase.rpc('get_current_match_window');
        results.push({
          name: 'Match Window Detection',
          status: window ? 'success' : 'warning',
          message: window ? 'Successfully detected match window' : 'No active match window',
          timestamp: new Date()
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
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
}