import React from 'react';
import { Link } from 'react-router-dom';

export default function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 p-4">
        <nav className="space-y-2">
          <Link to="/" className="block p-2 hover:bg-gray-200 rounded">
            Dashboard
          </Link>
          <Link to="/backend" className="block p-2 hover:bg-gray-200 rounded">
            Backend Dashboard
          </Link>
          <Link to="/backend/calculations" className="block p-2 hover:bg-gray-200 rounded">
            Calculations
          </Link>
          <Link to="/backend/scheduler" className="block p-2 hover:bg-gray-200 rounded">
            Scheduler
          </Link>
          <Link to="/backend/logs" className="block p-2 hover:bg-gray-200 rounded">
            Logs
          </Link>
          <Link to="/backend/gameweek-live" className="block p-2 hover:bg-gray-200 rounded">
            Gameweek Live
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}