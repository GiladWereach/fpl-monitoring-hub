import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useSessionContext } from '@supabase/auth-helpers-react';

const Login = () => {
  const navigate = useNavigate();
  const { session } = useSessionContext();

  useEffect(() => {
    const checkAccess = async () => {
      if (session?.user) {
        try {
          console.log('Checking access for user:', session.user.id);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }

          console.log('Profile data:', profile);
          if (profile?.role === 'admin') {
            navigate('/backend');
          }
        } catch (error) {
          console.error('Error in checkAccess:', error);
        }
      }
    };

    checkAccess();
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Backend Access</h2>
          <p className="mt-2 text-gray-600">Sign in to access the backend monitoring system</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          theme="light"
        />
      </div>
    </div>
  );
};

export default Login;