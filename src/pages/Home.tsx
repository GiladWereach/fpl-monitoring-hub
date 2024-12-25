import React from 'react';
import { ChartLineUp, ArrowRightLeft, TrendingUp, Settings, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2]">
            Elevate Your FPL Game
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Advanced analytics and live insights for the modern FPL manager
          </p>
          
          {/* Team ID Input */}
          <div className="max-w-md mx-auto mt-8 space-y-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter your Team ID"
                className="w-full px-4 py-3 bg-[#2A3142] border border-[#3DFF9A]/20 rounded-lg focus:border-[#3DFF9A] focus:ring-1 focus:ring-[#3DFF9A] transition-all"
              />
              <Button 
                className="mt-4 w-full bg-[#3DFF9A] text-[#1A1F2C] hover:bg-[#50E3C2] transition-colors"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <ChartLineUp className="w-8 h-8 text-[#3DFF9A]" />,
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
              title: "Historical Analysis",
              description: "Deep dive into your team's historical performance"
            },
            {
              icon: <Users className="w-8 h-8 text-[#3DFF9A]" />,
              title: "Community Insights",
              description: "Learn from the community's collective wisdom"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-lg bg-[#2A3142] border border-[#3DFF9A]/20 hover:border-[#3DFF9A]/40 transition-all"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="container mx-auto px-4 py-16 border-t border-[#3DFF9A]/20">
        <h2 className="text-3xl font-bold text-center mb-12">Get Started in Minutes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Enter Team ID", description: "Input your FPL team ID to get started" },
            { step: "2", title: "View Analysis", description: "Get instant insights about your team" },
            { step: "3", title: "Track Performance", description: "Monitor your team's progress" },
            { step: "4", title: "Make Decisions", description: "Use data to improve your rank" }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#3DFF9A] text-[#1A1F2C] font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}