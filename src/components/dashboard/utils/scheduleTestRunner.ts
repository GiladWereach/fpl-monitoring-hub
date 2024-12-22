import { testScheduleExecution, verifyRetryMechanism } from './scheduleTestUtils';
import { toast } from "@/hooks/use-toast";

interface TestSuite {
  functionName: string;
  scheduleTypes: string[];
}

export async function runScheduleTests(testSuites: TestSuite[]) {
  console.log('Starting schedule test suite execution');
  const results = [];

  for (const suite of testSuites) {
    console.log(`Testing function: ${suite.functionName}`);
    
    // Test each schedule type
    for (const scheduleType of suite.scheduleTypes) {
      console.log(`Testing schedule type: ${scheduleType}`);
      
      const result = await testScheduleExecution(suite.functionName, scheduleType);
      results.push({
        functionName: suite.functionName,
        scheduleType,
        ...result
      });

      if (!result.success) {
        toast({
          title: "Schedule Test Failed",
          description: `${suite.functionName} (${scheduleType}): ${result.error}`,
          variant: "destructive",
        });
      }
    }

    // Verify retry mechanism
    console.log(`Verifying retry mechanism for: ${suite.functionName}`);
    const retryResult = await verifyRetryMechanism(suite.functionName);
    results.push({
      functionName: suite.functionName,
      scheduleType: 'retry-test',
      ...retryResult
    });

    if (!retryResult.success) {
      toast({
        title: "Retry Mechanism Test Failed",
        description: `${suite.functionName}: ${retryResult.error}`,
        variant: "destructive",
      });
    }
  }

  // Log final results
  console.log('Test suite execution completed:', results);
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;

  toast({
    title: "Schedule Tests Completed",
    description: `${successCount}/${totalTests} tests passed`,
    variant: successCount === totalTests ? "default" : "destructive",
  });

  return results;
}

export function generateTestReport(results: any[]) {
  return {
    totalTests: results.length,
    passedTests: results.filter(r => r.success).length,
    failedTests: results.filter(r => !r.success).length,
    averageExecutionTime: results.reduce((acc, r) => acc + (r.executionTime || 0), 0) / results.length,
    retryStats: {
      totalRetries: results.reduce((acc, r) => acc + (r.retryCount || 0), 0),
      maxRetries: Math.max(...results.map(r => r.retryCount || 0))
    },
    failures: results.filter(r => !r.success).map(r => ({
      functionName: r.functionName,
      scheduleType: r.scheduleType,
      error: r.error
    }))
  };
}