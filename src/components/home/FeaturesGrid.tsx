import React from 'react';
import { LineChart, ArrowRightLeft, TrendingUp, Settings, History, Users } from 'lucide-react';

export default function FeaturesGrid() {
  return (
    <section className="container mx-auto px-4 py-16 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            icon: <LineChart className="w-8 h-8 text-[#3DFF9A]" />,
            title: "Live Performance",
            description: "Real-time point tracking and performance analytics"
          },
          {
            icon: <ArrowRightLeft className="w-8 h-8 text-[#3DFF9A]" />,
            title: "Transfer Analysis",
            description: "Smart transfer suggestions based on data-driven insights"
          },
          {
            icon: <TrendingUp className="w-8 h-8 text-[#3DFF9A]" />,
            title: "Price Changes",
            description: "Accurate price change predictions and alerts"
          },
          {
            icon: <Settings className="w-8 h-8 text-[#3DFF9A]" />,
            title: "Team Optimization",
            description: "AI-powered team suggestions and formation optimizer"
          },
          {
            icon: <History className="w-8 h-8 text-[#3DFF9A]" />,
            title: "Community Insights",
            description: "Learn from the community's collective wisdom"
          },
          {
            icon: <Users className="w-8 h-8 text-[#3DFF9A]" />,
            title: "Historical Analysis",
            description: "Deep dive into your team's historical performance"
          }
        ].map((feature, index) => (
          <div 
            key={index}
            className="p-6 rounded-lg bg-[#1A1F2C]/50 backdrop-blur-sm border border-[#3DFF9A]/10 hover:border-[#3DFF9A]/30 transition-all group hover:transform hover:scale-105"
          >
            <div className="mb-4 group-hover:transform group-hover:scale-110 transition-transform">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}