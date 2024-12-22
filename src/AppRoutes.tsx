import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AdminGuard } from '@/components/auth/AdminGuard';

// Pages
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Players from '@/pages/Players';
import GameWeekLive from '@/pages/GameWeekLive';
import Dashboard from '@/pages/backend/Dashboard';
import Calculations from '@/pages/backend/Calculations';
import Logs from '@/pages/backend/Logs';
import Scheduler from '@/pages/backend/Scheduler';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/players" element={<Players />} />
      <Route path="/gameweek-live" element={<GameWeekLive />} />

      {/* Protected Backend Routes */}
      <Route path="/backend" element={<AdminGuard><Outlet /></AdminGuard>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calculations" element={<Calculations />} />
        <Route path="logs" element={<Logs />} />
        <Route path="scheduler" element={<Scheduler />} />
      </Route>
    </Routes>
  );
};