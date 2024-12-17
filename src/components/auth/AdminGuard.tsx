import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, redirecting to login');
        throw new Error('No user found');
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return profile;
    },
    retry: false,
    onError: () => {
      navigate('/login');
    }
  });

  useEffect(() => {
    if (!isLoading && (!profile || profile.role !== 'admin')) {
      console.log('User not authorized, redirecting to login');
      navigate('/login');
    }
  }, [profile, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}