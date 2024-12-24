import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Activity, 
  Calendar, 
  Database,
  ChevronRight,
  Timer
} from 'lucide-react';
import { 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(true);

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Backend</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link to={item.path} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <Collapsible
          open={isMonitoringOpen}
          onOpenChange={setIsMonitoringOpen}
          className="w-full"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-accent rounded-md">
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
                    <SidebarMenuButton asChild>
                      <Link to={item.path} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    </SidebarContent>
  );
}