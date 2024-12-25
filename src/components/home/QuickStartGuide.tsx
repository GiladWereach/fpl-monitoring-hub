import React from 'react';

export default function QuickStartGuide() {
  return (
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
  );
}