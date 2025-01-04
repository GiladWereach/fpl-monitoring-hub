import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { validateTeamId } from '@/utils/team-validation';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TeamIdFormProps {
  initialTeamId?: string;
}

export function TeamIdForm({ initialTeamId = '' }: TeamIdFormProps) {
  const [teamId, setTeamId] = useState<string>(initialTeamId);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const validationResult = await validateTeamId(teamId);

      if (!validationResult.isValid) {
        toast({
          title: "Invalid Team ID",
          description: validationResult.error || "Please enter a valid FPL team ID",
          variant: "destructive",
        });
        return;
      }

      if (validationResult.isReturning) {
        console.log('Returning user detected, last gameweek:', validationResult.lastGameweek);
        toast({
          title: "Welcome Back!",
          description: "Fetching your latest team data...",
        });
      }

      console.log('Fetching team data for ID:', teamId);
      const { data: response, error } = await supabase.functions.invoke('fetch-team-data', {
        body: { teamId: Number(teamId) }
      });

      if (error) throw error;

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch team data');
      }

      console.log('Team data fetched successfully:', response);

      localStorage.setItem('lastTeamId', teamId);

      toast({
        title: validationResult.isReturning ? "Team Updated" : "Team Loaded",
        description: "Redirecting to your team view...",
      });

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
  );
}