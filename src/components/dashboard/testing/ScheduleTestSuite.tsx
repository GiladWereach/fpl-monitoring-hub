import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, PlayCircle } from "lucide-react";
import { TestResult, TestSuite } from "../types/scheduling";
import { runScheduleTests } from "../utils/testing/testRunner";
import { toast } from "@/hooks/use-toast";

export function ScheduleTestSuite() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleRunTests = async () => {
    setIsRunning(true);
    console.log("Starting schedule test suite execution");

    try {
      const testSuites: TestSuite[] = [
        {
          functionName: "fetch-live-gameweek",
          scheduleTypes: ["time_based", "event_based"]
        },
        {
          functionName: "fetch-fixtures",
          scheduleTypes: ["time_based"]
        }
      ];

      const testResults = await runScheduleTests(testSuites);
      console.log("Test results:", testResults);
      setResults(testResults);

      const failedTests = testResults.filter(r => !r.success);
      if (failedTests.length > 0) {
        toast({
          title: "Test Suite Completed with Failures",
          description: `${failedTests.length} tests failed. Check the results for details.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Test Suite Completed Successfully",
          description: "All tests passed!"
        });
      }
    } catch (error) {
      console.error("Error running test suite:", error);
      toast({
        title: "Test Suite Error",
        description: "Failed to execute test suite. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Schedule Test Suite</h3>
        <Button 
          onClick={handleRunTests} 
          disabled={isRunning}
          className="gap-2"
        >
          <PlayCircle className="h-4 w-4" />
          Run Tests
        </Button>
      </div>

      {results.length > 0 ? (
        <ScrollArea className="h-[300px] w-full">
          <div className="space-y-2">
            {results.map((result, index) => (
              <Alert key={index} variant={result.success ? "default" : "destructive"}>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <span>
                      {result.functionName} ({result.scheduleType})
                    </span>
                    <span className="text-sm">
                      {result.success ? 
                        `Passed (${result.executionTime}ms)` : 
                        `Failed: ${result.error}`
                      }
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            No tests have been run yet. Click "Run Tests" to start the test suite.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}