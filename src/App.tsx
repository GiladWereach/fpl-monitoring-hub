import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminGuard } from './components/auth/AdminGuard';
import AppSidebar from './components/layout/AppSidebar';
import BackendDashboard from './pages/backend/Dashboard';
import BackendCalculations from './pages/backend/Calculations';
import BackendLogs from './pages/backend/Logs';
import BackendScheduler from './pages/backend/Scheduler';
import GameWeekLive from './pages/GameWeekLive';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './integrations/supabase/client';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />

            {/* Admin routes */}
            <Route
              path="/backend/*"
              element={
                <AdminGuard>
                  <AppSidebar>
                    <Routes>
                      <Route path="/" element={<BackendDashboard />} />
                      <Route path="/calculations" element={<BackendCalculations />} />
                      <Route path="/logs" element={<BackendLogs />} />
                      <Route path="/scheduler" element={<BackendScheduler />} />
                      <Route path="/gameweek-live" element={<GameWeekLive />} />
                    </Routes>
                  </AppSidebar>
                </AdminGuard>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SessionContextProvider>
    </QueryClientProvider>
  );
}