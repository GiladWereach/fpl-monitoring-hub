import {
  Activity,
  Calculator,
  ChartBar,
  Clock,
  Database,
  Home,
  Server,
  Settings,
  Terminal,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/backend" },
  { title: "Calculations", icon: Calculator, path: "/backend/calculations" },
  { title: "API Monitor", icon: Activity, path: "/api" },
  { title: "Database", icon: Database, path: "/database" },
  { title: "Edge Functions", icon: Terminal, path: "/functions" },
  { title: "Server Status", icon: Server, path: "/status" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

const calculationTypes = [
  { title: "Points Calculations", icon: Calculator },
  { title: "Effective Ownership", icon: ChartBar },
  { title: "Price Changes", icon: Activity },
  { title: "Bonus Predictions", icon: Clock },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path} className="flex items-center gap-3">
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
          <SidebarGroupLabel>Calculation Types</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {calculationTypes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}