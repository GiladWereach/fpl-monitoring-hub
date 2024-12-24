import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function ScheduleOverrideManager() {
  const { data: overrides, isLoading } = useQuery({
    queryKey: ['schedule-overrides'],
    queryFn: async () => {
      console.log('Fetching schedule overrides');
      const { data, error } = await supabase
        .from('function_schedules')
        .select('*')
        .eq('frequency_type', 'override')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching overrides:', error);
        throw error;
      }
      return data;
    }
  });

  const handleCreateOverride = async () => {
    try {
      console.log('Creating new schedule override');
      const { error } = await supabase
        .from('function_schedules')
        .insert({
          frequency_type: 'override',
          status: 'active',
          base_interval_minutes: 5,
          function_name: 'override-schedule' // Default name for new overrides
        });

      if (error) {
        console.error('Error creating override:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Schedule override created",
      });
    } catch (error) {
      console.error('Error creating override:', error);
      toast({
        title: "Error",
        description: "Failed to create override",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Schedule Overrides</h3>
        <Button onClick={handleCreateOverride} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Override
        </Button>
      </div>

      <div className="space-y-4">
        {overrides?.map((override) => (
          <div 
            key={override.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{override.function_name}</p>
                <p className="text-sm text-muted-foreground">
                  Every {override.base_interval_minutes} minutes
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Created {format(new Date(override.created_at), 'MMM d, yyyy')}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}