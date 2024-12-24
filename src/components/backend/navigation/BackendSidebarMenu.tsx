import React from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MenuItems } from './MenuItems';
import { MonitoringSection } from './MonitoringSection';

export function BackendSidebarMenu() {
  const [isMonitoringOpen, setIsMonitoringOpen] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [isPinned, setIsPinned] = React.useState(true);

  const handleNavigation = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsExpanded(false);
    }
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    setIsExpanded(!isPinned);
  };

  console.log('BackendSidebarMenu render state:', { isExpanded, isPinned });

  return (
    <Sidebar 
      className={cn(
        "transition-all duration-300 border-r h-screen relative bg-background",
        isExpanded ? "w-[240px]" : "w-[60px]"
      )} 
      variant="sidebar" 
      collapsible="icon"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-50"
        onClick={togglePin}
      >
        {isPinned ? (
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
            <SidebarTrigger />
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