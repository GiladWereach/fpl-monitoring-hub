import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import FeaturesGrid from '@/components/home/FeaturesGrid';
import QuickStartGuide from '@/components/home/QuickStartGuide';

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
      canvas.height = 600; // Only cover the header area
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Player names for the matrix effect
    const playerNames = ['Haaland', 'Salah', 'Kane', 'Saka', 'Rashford', 'De Bruyne', 'Son', 'Bruno', 'Trent', 'Foden'];
    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(0);

    function draw() {
      // Slowed down the fade effect by reducing the opacity
      ctx.fillStyle = 'rgba(13, 17, 23, 0.05)'; // Reduced from 0.1 to 0.05
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#3DFF9A';
      ctx.font = '15px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = playerNames[Math.floor(Math.random() * playerNames.length)];
        const x = i * 20;
        const y = drops[i] * 20;
        
        ctx.fillStyle = `rgba(61, 255, 154, ${Math.random() * 0.3})`; // Reduced opacity from 0.5 to 0.3
        ctx.fillText(text, x, y);
        
        // Slowed down the drop speed by reducing the probability of resetting
        if (y > canvas.height && Math.random() > 0.995) { // Changed from 0.99 to 0.995
          drops[i] = 0;
        }
        // Slowed down the falling speed by using a smaller increment
        drops[i] += 0.5; // Changed from 1 to 0.5
      }

      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117] text-white relative overflow-hidden">
      {/* Hero Section with Canvas Background */}
      <section className="relative h-[600px]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.3 }}
        />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
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
        </div>
      </section>

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Quick Start Guide */}
      <QuickStartGuide />
    </div>
  );
}