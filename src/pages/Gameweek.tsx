import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List } from 'lucide-react';

export default function Gameweek() {
  const { data: currentGameweek, isLoading: gameweekLoading } = useQuery({
    queryKey: ['current-gameweek'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_current', true)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (gameweekLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Gameweek {currentGameweek?.id} Live
        </h1>
      </div>

      <Tabs defaultValue="pitch" className="w-full">
        <TabsList>
          <TabsTrigger value="pitch" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Pitch View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pitch">
          <Card className="p-4">
            <div className="text-center text-gray-500">
              Pitch view coming soon...
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="p-4">
            <div className="text-center text-gray-500">
              List view coming soon...
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}