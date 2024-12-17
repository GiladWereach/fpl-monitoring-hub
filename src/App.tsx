import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminGuard } from './components/auth/AdminGuard';
import AppSidebar from './components/layout/AppSidebar';
import BackendDashboard from './pages/backend/Dashboard';
import BackendCalculations from './pages/backend/Calculations';
import BackendLogs from './pages/backend/Logs';
import BackendScheduler from './pages/backend/Scheduler';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

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
                  </Routes>
                </AppSidebar>
              </AdminGuard>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}