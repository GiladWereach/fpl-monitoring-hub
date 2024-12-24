import React from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MenuItems } from './MenuItems';
import { MonitoringSection } from './MonitoringSection';

interface BackendSidebarMenuProps {
  onExpandedChange?: (expanded: boolean) => void;
}

export function BackendSidebarMenu({ onExpandedChange }: BackendSidebarMenuProps) {
  const [isMonitoringOpen, setIsMonitoringOpen] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(true);

  const handleNavigation = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onExpandedChange?.(newExpandedState);
  };

  return (
    <Sidebar 
      className={cn(
        "transition-all duration-300 border-r fixed h-full bg-background z-40",
        isExpanded ? "w-[240px]" : "w-[60px]"
      )} 
      variant="sidebar"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={toggleSidebar}
      >
        {isExpanded ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeft className="h-4 w-4" />
        )}
      </Button>

      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-4 py-2">
            <SidebarGroupLabel className={cn(
              "transition-opacity duration-300",
              !isExpanded && "opacity-0"
            )}>
              Backend
            </SidebarGroupLabel>
          </div>
          <MenuItems 
            isExpanded={isExpanded}
            isLoading={isLoading}
            handleNavigation={handleNavigation}
          />
        </SidebarGroup>

        <SidebarGroup>
          <MonitoringSection 
            isExpanded={isExpanded}
            isLoading={isLoading}
            isMonitoringOpen={isMonitoringOpen}
            setIsMonitoringOpen={setIsMonitoringOpen}
            handleNavigation={handleNavigation}
          />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}