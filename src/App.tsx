import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppSidebar from '@/components/layout/AppSidebar';
import Dashboard from '@/pages/Dashboard';
import BackendDashboard from '@/pages/backend/Dashboard';
import BackendCalculations from '@/pages/backend/Calculations';
import BackendScheduler from '@/pages/backend/Scheduler';
import BackendLogs from '@/pages/backend/Logs';
import GameWeekLive from '@/pages/GameWeekLive';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppSidebar>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/backend" element={<BackendDashboard />} />
            <Route path="/backend/calculations" element={<BackendCalculations />} />
            <Route path="/backend/scheduler" element={<BackendScheduler />} />
            <Route path="/backend/logs" element={<BackendLogs />} />
            <Route path="/backend/gameweek-live" element={<GameWeekLive />} />
          </Routes>
        </AppSidebar>
      </Router>
    </QueryClientProvider>
  );
}

export default App;