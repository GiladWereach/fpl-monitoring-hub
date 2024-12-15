import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionContextProvider, useSessionContext } from '@supabase/auth-helpers-react';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Players from "./pages/Players";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useSessionContext();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user) {
        setIsAdmin(false);
        return;
      }

      try {
        console.log('Checking admin status for user:', session.user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setIsAdmin(false);
          return;
        }

        console.log('Profile data:', data);
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error in checkAdminStatus:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [session]);

  if (isAdmin === null) {
    return null; // Loading state
  }

  if (!session || !isAdmin) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionContextProvider supabaseClient={supabase}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/backend" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Players />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SessionContextProvider>
  </QueryClientProvider>
);

export default App;