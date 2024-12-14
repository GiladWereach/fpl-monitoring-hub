import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Play, RefreshCw } from "lucide-react";
import { ScheduleManager } from "./ScheduleManager";

const functions = [
  { name: "Teams", function: "fetch-teams" },
  { name: "Events", function: "fetch-events" },
  { name: "Game Settings", function: "fetch-game-settings" },
  { name: "Element Types", function: "fetch-element-types" },
  { name: "Chips", function: "fetch-chips" },
  { name: "Players", function: "fetch-players" },
  { name: "Player Details", function: "fetch-player-details" },
  { name: "Scoring Rules", function: "fetch-scoring-rules" },
  { name: "Fixtures", function: "fetch-fixtures" },
];

export function EdgeFunctionManager() {
  const [loading, setLoading] = useState<string | null>(null);

  const invokeFetchFunction = async (functionName: string) => {
    try {
      setLoading(functionName);
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${data.message}`,
      });
    } catch (error) {
      console.error(`Error invoking ${functionName}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch ${functionName} data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const refreshAll = async () => {
    setLoading("all");
    for (const func of functions) {
      try {
        const { data, error } = await supabase.functions.invoke(func.function);
        if (error) throw error;
        toast({
          title: "Success",
          description: `${data.message}`,
        });
      } catch (error) {
        console.error(`Error invoking ${func.function}:`, error);
        toast({
          title: "Error",
          description: `Failed to fetch ${func.name} data: ${error.message}`,
          variant: "destructive",
        });
      }
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Edge Functions Manager</h2>
        <Button
          onClick={refreshAll}
          disabled={loading !== null}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {functions.map((func) => (
          <div
            key={func.function}
            className="glass-card p-4 rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{func.name}</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => invokeFetchFunction(func.function)}
                  disabled={loading !== null}
                >
                  {loading === func.function ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <ScheduleManager
                  functionName={func.function}
                  functionDisplayName={func.name}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}