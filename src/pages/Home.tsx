import React from 'react';
import { LineChart, ArrowRightLeft, TrendingUp, Settings, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0D1117] text-white relative overflow-hidden">
      {/* Tech Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Diagonal Shiny Stripes */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute h-[200px] w-[2000px] rotate-45 transform"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(61, 255, 154, 0.15), transparent)',
                top: `${i * 200}px`,
                left: `-${i * 100}px`,
                animation: `slide${i} 10s infinite linear`,
              }}
            />
          ))}
        </div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-[#3DFF9A] opacity-5 blur-3xl" />
        <div className="absolute bottom-40 left-20 w-40 h-40 rounded-full bg-[#3DFF9A] opacity-5 blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2]">
            Elevate Your FPL Game
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Advanced analytics and live insights for the modern FPL manager
          </p>
          
          {/* Team ID Input */}
          <div className="max-w-md mx-auto mt-8 space-y-4 relative">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter your Team ID"
                className="w-full px-4 py-3 bg-[#1A1F2C] border border-[#3DFF9A]/20 rounded-lg focus:border-[#3DFF9A] focus:ring-1 focus:ring-[#3DFF9A] transition-all"
              />
              <Button 
                className="mt-4 w-full bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2] text-[#0D1117] hover:from-[#50E3C2] hover:to-[#3DFF9A] transition-all duration-300"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
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
              className="p-6 rounded-lg bg-[#1A1F2C]/50 backdrop-blur-sm border border-[#3DFF9A]/10 hover:border-[#3DFF9A]/30 transition-all group hover:transform hover:scale-105"
            >
              <div className="mb-4 group-hover:transform group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="container mx-auto px-4 py-16 border-t border-[#3DFF9A]/10 relative">
        <h2 className="text-3xl font-bold text-center mb-12">Get Started in Minutes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Enter Team ID", description: "Input your FPL team ID to get started" },
            { step: "2", title: "View Analysis", description: "Get instant insights about your team" },
            { step: "3", title: "Track Performance", description: "Monitor your team's progress" },
            { step: "4", title: "Make Decisions", description: "Use data to improve your rank" }
          ].map((step, index) => (
            <div key={index} className="text-center group">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#3DFF9A] to-[#50E3C2] text-[#0D1117] font-bold text-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Add keyframes for the sliding animations */}
      <style jsx>{`
        @keyframes slide0 { from { transform: translateX(-100%) rotate(45deg); } to { transform: translateX(100%) rotate(45deg); } }
        @keyframes slide1 { from { transform: translateX(-120%) rotate(45deg); } to { transform: translateX(80%) rotate(45deg); } }
        @keyframes slide2 { from { transform: translateX(-140%) rotate(45deg); } to { transform: translateX(60%) rotate(45deg); } }
        @keyframes slide3 { from { transform: translateX(-160%) rotate(45deg); } to { transform: translateX(40%) rotate(45deg); } }
        @keyframes slide4 { from { transform: translateX(-180%) rotate(45deg); } to { transform: translateX(20%) rotate(45deg); } }
        @keyframes slide5 { from { transform: translateX(-200%) rotate(45deg); } to { transform: translateX(0%) rotate(45deg); } }
        @keyframes slide6 { from { transform: translateX(-220%) rotate(45deg); } to { transform: translateX(-20%) rotate(45deg); } }
        @keyframes slide7 { from { transform: translateX(-240%) rotate(45deg); } to { transform: translateX(-40%) rotate(45deg); } }
        @keyframes slide8 { from { transform: translateX(-260%) rotate(45deg); } to { transform: translateX(-60%) rotate(45deg); } }
        @keyframes slide9 { from { transform: translateX(-280%) rotate(45deg); } to { transform: translateX(-80%) rotate(45deg); } }
      `}</style>
    </div>
  );
}