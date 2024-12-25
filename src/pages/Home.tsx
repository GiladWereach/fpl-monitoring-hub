import React, { useEffect, useRef } from 'react';
import { LineChart, ArrowRightLeft, TrendingUp, Settings, History, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Matrix-like numbers (player stats)
    const stats = ['90', '12', '38', '100', '7.5', '250', '3', '11.5'];
    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(0);
    
    const hexSize = 30;
    const hexagons: { x: number; y: number; size: number; opacity: number }[] = [];
    
    // Create initial hexagons
    for (let i = 0; i < 15; i++) {
      hexagons.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: hexSize + Math.random() * 20,
        opacity: 0.1 + Math.random() * 0.2
      });
    }

    // Draw hexagon
    function drawHexagon(x: number, y: number, size: number, opacity: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const xPos = x + size * Math.cos(angle);
        const yPos = y + size * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(xPos, yPos);
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(61, 255, 154, ${opacity})`;
      ctx.stroke();
    }

    function draw() {
      ctx.fillStyle = 'rgba(13, 17, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw matrix effect
      ctx.fillStyle = '#3DFF9A';
      ctx.font = '15px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = stats[Math.floor(Math.random() * stats.length)];
        const x = i * 20;
        const y = drops[i] * 20;
        
        ctx.fillStyle = `rgba(61, 255, 154, ${Math.random() * 0.5})`;
        ctx.fillText(text, x, y);
        
        if (y > canvas.height && Math.random() > 0.99) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      // Draw and update hexagons
      hexagons.forEach((hex, i) => {
        drawHexagon(hex.x, hex.y, hex.size, hex.opacity);
        hex.y = (hex.y + 0.5) % canvas.height;
        hex.x += Math.sin(Date.now() * 0.001 + i) * 0.5;
        if (hex.x > canvas.width + hex.size) hex.x = -hex.size;
        if (hex.x < -hex.size) hex.x = canvas.width + hex.size;
      });

      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117] text-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.3 }}
      />

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
    </div>
  );
}