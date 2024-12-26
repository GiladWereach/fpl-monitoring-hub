import { TestResult } from '../types/scheduling';

export interface TestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageExecutionTime: number;
  retryStats: {
    totalRetries: number;
    maxRetries: number;
  };
  failures: Array<{
    functionName: string;
    scheduleType?: string;
    error: string;
  }>;
}

export function generateTestReport(results: TestResult[]): TestReport {
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
      error: r.error || 'Unknown error'
    }))
  };
}