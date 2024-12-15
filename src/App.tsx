import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import Dashboard from '@/pages/Dashboard';
import BackendDashboard from '@/pages/backend/Dashboard';
import BackendCalculations from '@/pages/backend/Calculations';
import BackendScheduler from '@/pages/backend/Scheduler';
import BackendLogs from '@/pages/backend/Logs';
import GameWeekLive from '@/pages/GameWeekLive';

function App() {
  return (
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
  );
}

export default App;