import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Search,
  ClipboardCheck,
  ArrowRight
} from 'lucide-react';

export function QuickStartSection() {
  const steps = [
    {
      icon: <Search className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Find Your Team ID",
      description: "Log in to the official FPL website and find your team ID in the URL"
    },
    {
      icon: <ClipboardCheck className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Enter Your ID",
      description: "Paste your team ID in the input field above"
    },
    {
      icon: <ArrowRight className="h-6 w-6 text-[#3DFF9A]" />,
      title: "Get Started",
      description: "Click 'Get Started' to view your live team performance"
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-[#151921]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Quick Start Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <Card key={index} className="p-6 bg-[#1A1F2C] border-[#3DFF9A]/20">
              <div className="flex items-center gap-4 mb-4">
                {step.icon}
                <h3 className="text-xl font-semibold">{step.title}</h3>
              </div>
              <p className="text-gray-400">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}