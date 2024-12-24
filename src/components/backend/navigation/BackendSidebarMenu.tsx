import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Activity, 
  Calendar, 
  Database,
  ChevronRight,
  Timer,
  Loader,
  PanelLeftClose
} from 'lucide-react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/backend/dashboard" },
  { title: "Scheduler", icon: Calendar, path: "/backend/scheduler" },
  { title: "Logs", icon: Activity, path: "/backend/logs" },
  { title: "Calculations", icon: Database, path: "/backend/calculations" },
  { title: "Settings", icon: Settings, path: "/backend/settings" }
];

const monitoringItems = [
  { title: "Live Gameweek", icon: Timer, path: "/gameweek-live" }
];

export function BackendSidebarMenu() {
  const [isMonitoringOpen, setIsMonitoringOpen] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const location = useLocation();

  const handleNavigation = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  return (
    <Sidebar 
      className={cn(
        "transition-all duration-300 border-r",
        isExpanded ? "w-[240px]" : "w-[60px]"
      )} 
      variant="sidebar" 
      collapsible="icon"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
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
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
        </SidebarGroup>

        <SidebarGroup>
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
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}