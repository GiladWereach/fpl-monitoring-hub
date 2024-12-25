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

    // Player names for the animation
    const playerNames = ['Haaland', 'Salah', 'Palmer','Jota','Isak','Gordon','Pickford','Semenyo','Kerkez','Mateta','Smith Rowe','Iwobi','Cucurella','Watkins','Rogers','Schär' ,'Martinez','Gibbs-White','Elanga','Kulusevski','Maddison','Solanke','Bowen','Paquetá','Kudus','Cunha','Semedo','Onana','Van Dijk','Vardy','Buonanotte', 'Mbuemo', 'Saka', 'Rashford', 'De Bruyne', 'Son', 'Bruno', 'Trent', 'Foden'];
    
    // Array to store active name animations
    type NameAnimation = {
      x: number;
      y: number;
      name: string;
      opacity: number;
      scale: number;
      fadeDirection: 'in' | 'out';
    };
    
    let activeAnimations: NameAnimation[] = [];
    
    // Function to create a new animation at a random position
    const createNewAnimation = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const name = playerNames[Math.floor(Math.random() * playerNames.length)];
      
      return {
        x,
        y,
        name,
        opacity: 0,
        scale: 0.5,
        fadeDirection: 'in' as const,
      };
    };

    function draw() {
      // Clear canvas completely each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Randomly add new animations
      if (Math.random() > 0.97 && activeAnimations.length < 15) {
        activeAnimations.push(createNewAnimation());
      }

      // Update and draw each animation
      activeAnimations = activeAnimations.filter(animation => {
        // Update opacity based on fade direction
        if (animation.fadeDirection === 'in') {
          animation.opacity += 0.02;
          animation.scale += 0.02;
          if (animation.opacity >= 0.75) { // Reduced from 0.8 to 0.5 for lower final opacity
            animation.fadeDirection = 'out';
          }
        } else {
          animation.opacity -= 0.02;
          animation.scale -= 0.01;
        }

        // Draw the name
        ctx.save();
        ctx.font = '20px monospace';
        ctx.fillStyle = `rgba(61, 255, 154, ${animation.opacity})`;
        ctx.translate(animation.x, animation.y);
        ctx.scale(animation.scale, animation.scale);
        ctx.fillText(animation.name, -ctx.measureText(animation.name).width / 2, 0);
        ctx.restore();

        // Keep animation if still visible
        return animation.opacity > 0;
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
