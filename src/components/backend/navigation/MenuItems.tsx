import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Activity, Calendar, Database, Timer, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const menuItems = [
  { title: "Dashboard", icon: Home, path: "/backend/dashboard" },
  { title: "Scheduler", icon: Calendar, path: "/backend/scheduler" },
  { title: "Logs", icon: Activity, path: "/backend/logs" },
  { title: "Calculations", icon: Database, path: "/backend/calculations" },
  { title: "Settings", icon: Settings, path: "/backend/settings" }
];

export const monitoringItems = [
  { title: "Live Gameweek", icon: Timer, path: "/gameweek-live" }
];

interface MenuItemsProps {
  isExpanded: boolean;
  isLoading: boolean;
  handleNavigation: () => Promise<void>;
}

export function MenuItems({ isExpanded, isLoading, handleNavigation }: MenuItemsProps) {
  const location = useLocation();

  return (
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
  );
}