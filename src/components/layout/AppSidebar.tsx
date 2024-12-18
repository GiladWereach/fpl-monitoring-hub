import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AppSidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isMobile = useIsMobile();

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/backend", label: "Backend Dashboard" },
    { path: "/backend/calculations", label: "Calculations" },
    { path: "/backend/scheduler", label: "Scheduler" },
    { path: "/backend/logs", label: "Logs" },
    { path: "/backend/gameweek-live", label: "Gameweek Live" }
  ];

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out bg-background border-r",
          {
            "-translate-x-full md:translate-x-0": !isOpen,
            "translate-x-0": isOpen
          }
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="space-y-2 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "block p-3 rounded-lg hover:bg-accent transition-colors",
                  "text-sm font-medium",
                  "active:scale-95",
                  location.pathname === item.path && "bg-accent"
                )}
                onClick={() => isMobile && setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-4 md:p-8 transition-all duration-200 ease-in-out",
        "min-h-screen w-full",
        "overflow-x-hidden"
      )}>
        <div className="max-w-7xl mx-auto">
          {/* Content padding for mobile menu */}
          <div className="h-16 md:h-0" />
          {children}
        </div>
      </main>

      {/* Backdrop for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}