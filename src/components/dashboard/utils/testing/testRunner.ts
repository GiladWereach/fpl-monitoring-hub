import { TestSuite, TestResult } from '../../types/scheduling';
import { toast } from "@/hooks/use-toast";
import { createTestScenarios, runTestScenario } from './scheduleTestScenarios';
import { generateTestReport, TestReport } from './reportGenerator';

export async function runScheduleTests(testSuites: TestSuite[]): Promise<TestResult[]> {
  console.log('Starting enhanced schedule test suite execution');
  const results: TestResult[] = [];

  for (const suite of testSuites) {
    console.log(`Testing function: ${suite.functionName}`);
    
    // Get test scenarios for this function
    const scenarios = createTestScenarios(suite.functionName);
    
    // Run each scenario
    for (const scenario of scenarios) {
      console.log(`Running scenario: ${scenario.name}`);
      const result = await runTestScenario(scenario);
      results.push({
        ...result,
        functionName: suite.functionName
      });
    }
  }

  const report = generateTestReport(results);
  logTestResults(report);

  return results;
}

function logTestResults(report: TestReport) {
  console.log('Enhanced Test Suite Results:', {
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