import { TestSuite, TestResult } from '../../types/scheduling';
import { toast } from "@/hooks/use-toast";
import { executeScheduleTest } from './scheduleTestExecutor';
import { verifyRetryMechanism } from './retryTester';
import { generateTestReport, TestReport } from './reportGenerator';

export async function runScheduleTests(testSuites: TestSuite[]): Promise<TestResult[]> {
  console.log('Starting schedule test suite execution');
  const results: TestResult[] = [];

  for (const suite of testSuites) {
    console.log(`Testing function: ${suite.functionName}`);
    
    // Test each schedule type
    for (const scheduleType of suite.scheduleTypes) {
      console.log(`Testing schedule type: ${scheduleType}`);
      
      const result = await executeScheduleTest(suite.functionName, scheduleType);
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
  }

  const report = generateTestReport(results);
  logTestResults(report);

  return results;
}

function logTestResults(report: TestReport) {
  console.log('Test Suite Results:', {
    totalTests: report.totalTests,
    passedTests: report.passedTests,
    failedTests: report.failedTests,
    averageExecutionTime: report.averageExecutionTime,
    retryStats: report.retryStats
  });

  toast({
    title: "Schedule Tests Completed",
    description: `${report.passedTests}/${report.totalTests} tests passed`,
    variant: report.failedTests === 0 ? "default" : "destructive",
  });
}