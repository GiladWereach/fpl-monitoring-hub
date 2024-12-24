import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EdgeFunctionManager } from "@/components/dashboard/EdgeFunctionManager";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EdgeFunctionSectionProps {
  onNewFunction: () => void;
}

export function EdgeFunctionSection({ onNewFunction }: EdgeFunctionSectionProps) {
  return (
    <Card className="p-6 bg-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">Edge Functions</h2>
        <Button onClick={onNewFunction} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Function
        </Button>
      </div>
      <ScrollArea className="h-[400px] w-full rounded-md">
        <div className="min-w-[600px] p-1">
          <EdgeFunctionManager />
        </div>
      </ScrollArea>
    </Card>
  );
}