import { CalculationControlCenter } from '@/components/dashboard/CalculationControlCenter';
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BackendSidebarMenu } from "@/components/backend/navigation/BackendSidebarMenu";
import { cn } from "@/lib/utils";

export default function BackendCalculations() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider defaultOpen>
        <BackendSidebarMenu onExpandedChange={setIsExpanded} />
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out p-6",
        )}>
          <div className={cn(
            "space-y-6",
            "max-w-7xl",
            isExpanded ? "ml-[240px]" : "ml-[60px]"
          )}>
            <CalculationControlCenter />
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
