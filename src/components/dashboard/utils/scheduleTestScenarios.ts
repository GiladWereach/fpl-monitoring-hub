import { supabase } from "@/integrations/supabase/client";
import { TestResult } from '../types/scheduling';
import { toast } from "@/hooks/use-toast";

export interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<TestResult>;
  cleanup: () => Promise<void>;
}

export function createTestScenarios(functionName: string): TestScenario[] {
  console.log(`Creating test scenarios for ${functionName}`);
  
  return [
    {
      name: "Basic Schedule Execution",
      description: "Tests basic schedule creation and execution",
      setup: async () => {
        console.log("Setting up basic schedule execution test");
        const { error } = await supabase
          .from('schedules')
          .upsert({
            function_name: functionName,
            schedule_type: 'time_based',
            enabled: true,
            execution_config: {
              retry_count: 3,
              timeout_seconds: 30,
              retry_delay_seconds: 60
            }
          });
        
        if (error) throw error;
      },
      execute: async () => {
        console.log("Executing basic schedule test");
        const startTime = Date.now();
        
        try {
          const { error } = await supabase.functions.invoke(functionName);
          if (error) throw error;
          
          return {
            success: true,
            executionTime: Date.now() - startTime,
            functionName,
            scheduleType: 'time_based',
            retryCount: 0
          };
        } catch (error) {
          console.error(`Test execution failed for ${functionName}:`, error);
          return {
            success: false,
            error: error.message,
            functionName,
            scheduleType: 'time_based'
          };
        }
      },
      cleanup: async () => {
        console.log("Cleaning up basic schedule test");
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('function_name', functionName);
          
        if (error) {
          console.error("Cleanup failed:", error);
          throw error;
        }
      }
    }
  ];
}

export async function runTestScenario(scenario: TestScenario): Promise<TestResult> {
  console.log(`Running test scenario: ${scenario.name}`);
  
  try {
    await scenario.setup();
    const result = await scenario.execute();
    await scenario.cleanup();
    
    if (result.success) {
      toast({
        title: "Test Scenario Passed",
        description: `${scenario.name} completed successfully`,
      });
    } else {
      toast({
        title: "Test Scenario Failed",
        description: `${scenario.name}: ${result.error}`,
        variant: "destructive",
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Error in test scenario ${scenario.name}:`, error);
    return {
      success: false,
      error: error.message,
      functionName: scenario.name,
      scheduleType: 'time_based'
    };
  }
}