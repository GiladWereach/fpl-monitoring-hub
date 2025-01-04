import React, { useEffect, useState } from 'react';
import { HomeHeader } from '@/components/home/HomeHeader';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { QuickStartSection } from '@/components/home/QuickStartSection';
import { TeamIdForm } from '@/components/home/TeamIdForm';

export default function Home() {
  const [initialTeamId, setInitialTeamId] = useState<string>('');

  useEffect(() => {
    const lastTeamId = localStorage.getItem('lastTeamId');
    if (lastTeamId) {
      setInitialTeamId(lastTeamId);
    }
  }, []);

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
            
            <TeamIdForm initialTeamId={initialTeamId} />
          </div>
        </div>
      </section>

      <FeaturesSection />
      <QuickStartSection />
    </div>
  );
}