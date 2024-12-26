import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  LineChart, 
  Users, 
  Clock, 
  TrendingUp, 
  Shield, 
  Zap 
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: <LineChart className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Live Performance Tracking",
      description: "Real-time updates on your team's performance during gameweeks"
    },
    {
      icon: <Users className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Player Analysis",
      description: "Detailed statistics and performance metrics for every player"
    },
    {
      icon: <Clock className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Instant Updates",
      description: "Get immediate notifications for goals, assists, and bonus points"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Price Change Predictions",
      description: "Stay ahead with accurate player price change forecasts"
    },
    {
      icon: <Shield className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Team Management",
      description: "Easily manage your squad and track transfer strategies"
    },
    {
      icon: <Zap className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Live Bonus Points",
      description: "Track provisional bonus points as matches progress"
    }
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-[#1A1F2C] border-[#3DFF9A]/20">
              <div className="flex items-center gap-4 mb-4">
                {feature.icon}
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-gray-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}