import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroupContent } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { monitoringItems } from './MenuItems';

interface MonitoringSectionProps {
  isExpanded: boolean;
  isLoading: boolean;
  isMonitoringOpen: boolean;
  setIsMonitoringOpen: (open: boolean) => void;
  handleNavigation: () => Promise<void>;
}

export function MonitoringSection({ 
  isExpanded, 
  isLoading, 
  isMonitoringOpen, 
  setIsMonitoringOpen,
  handleNavigation 
}: MonitoringSectionProps) {
  const location = useLocation();

  return (
    <Collapsible
      open={isMonitoringOpen && isExpanded}
      onOpenChange={setIsMonitoringOpen}
      className="w-full"
    >
      <CollapsibleTrigger className={cn(
        "flex w-full items-center justify-between p-2 hover:bg-accent rounded-md",
        !isExpanded && "opacity-0"
      )}>
        <span className="text-sm font-medium">Monitoring</span>
        <ChevronRight
          className={`h-4 w-4 transition-transform duration-200 ${
            isMonitoringOpen ? "rotate-90" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarGroupContent>
          <SidebarMenu>
            {monitoringItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton 
                      asChild
                      className={cn(
                        "relative",
                        location.pathname === item.path && "bg-accent"
                      )}
                    >
                      <Link 
                        to={item.path} 
                        className="flex items-center gap-2"
                        onClick={handleNavigation}
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <item.icon className="h-4 w-4" />
                        )}
                        <span className={cn(
                          "transition-opacity duration-300",
                          !isExpanded && "opacity-0"
                        )}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </CollapsibleContent>
    </Collapsible>
  );
}