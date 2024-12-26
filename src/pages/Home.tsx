import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { HomeHeader } from '@/components/home/HomeHeader';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { QuickStartSection } from '@/components/home/QuickStartSection';

export default function Home() {
  const [teamId, setTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Restore last used team ID from localStorage
    const lastTeamId = localStorage.getItem('lastTeamId');
    if (lastTeamId) {
      setTeamId(lastTeamId);
    }
  }, []);

  const handleSubmit = async () => {
    if (!teamId || isNaN(Number(teamId))) {
      toast({
        title: "Invalid Team ID",
        description: "Please enter a valid FPL team ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching team data for ID:', teamId);
      const { data: response, error } = await supabase.functions.invoke('fetch-team-data', {
        body: { teamId: Number(teamId) }
      });

      if (error) throw error;

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch team data');
      }

      console.log('Team data fetched successfully:', response);

      // Save team ID to localStorage
      localStorage.setItem('lastTeamId', teamId);

      toast({
        title: "Team loaded successfully",
        description: "Redirecting to your team view...",
      });

      // Navigate to the gameweek view
      navigate('/gameweek');

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch team data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      <HomeHeader />
      
      <section className="relative mt-16 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2]">
              Elevate Your FPL Game
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
              Advanced analytics and live insights for the modern FPL manager
            </p>
            
            <div className="max-w-md mx-auto mt-8 space-y-4">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Enter your Team ID"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1A1F2C] border border-[#3DFF9A]/20 rounded-lg focus:border-[#3DFF9A] focus:ring-1 focus:ring-[#3DFF9A] transition-all"
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="mt-4 w-full bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2] text-[#0D1117] hover:from-[#50E3C2] hover:to-[#3DFF9A] transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading team data...</span>
                    </div>
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturesSection />
      <QuickStartSection />
    </div>
  );
}