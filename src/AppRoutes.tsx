import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AdminGuard } from '@/components/auth/AdminGuard';
import Navbar from '@/components/layout/Navbar';

// Pages
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Players from '@/pages/Players';
import Gameweek from '@/pages/Gameweek';
import GameWeekLive from '@/pages/backend/GameWeekLive';
import Dashboard from '@/pages/backend/Dashboard';
import Calculations from '@/pages/backend/Calculations';
import Logs from '@/pages/backend/Logs';
import Scheduler from '@/pages/backend/Scheduler';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with Navbar */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/players" element={<Players />} />
        <Route path="/gameweek" element={<Gameweek />} />
      </Route>

      {/* Protected Backend Routes */}
      <Route path="/backend" element={<AdminGuard><Outlet /></AdminGuard>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calculations" element={<Calculations />} />
        <Route path="logs" element={<Logs />} />
        <Route path="scheduler" element={<Scheduler />} />
        <Route path="gameweek-live" element={<GameWeekLive />} />
      </Route>
    </Routes>
  );
};