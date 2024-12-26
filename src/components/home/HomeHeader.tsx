import React from 'react';
import { useRef, useEffect } from 'react';

export function HomeHeader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = 600;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const playerNames = ['Haaland', 'Salah', 'Palmer','Jota','Isak','Gordon','Pickford','Semenyo','Kerkez','Mateta','Smith Rowe','Iwobi','Cucurella','Watkins','Rogers','Schär' ,'Martinez','Gibbs-White','Elanga','Kulusevski','Maddison','Solanke','Bowen','Paquetá','Kudus','Cunha','Semedo','Onana','Van Dijk','Vardy','Buonanotte', 'Mbuemo', 'Saka', 'Rashford', 'De Bruyne', 'Son', 'Bruno', 'Trent', 'Foden'];
    
    type NameAnimation = {
      x: number;
      y: number;
      name: string;
      opacity: number;
      scale: number;
      fadeDirection: 'in' | 'out';
    };
    
    let activeAnimations: NameAnimation[] = [];
    
    const createNewAnimation = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      name: playerNames[Math.floor(Math.random() * playerNames.length)],
      opacity: 0,
      scale: 0.5,
      fadeDirection: 'in' as const,
    });

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() > 0.97 && activeAnimations.length < 15) {
        activeAnimations.push(createNewAnimation());
      }

      activeAnimations = activeAnimations.filter(animation => {
        if (animation.fadeDirection === 'in') {
          animation.opacity += 0.01;
          animation.scale += 0.01;
          if (animation.opacity >= 0.75) {
            animation.fadeDirection = 'out';
          }
        } else {
          animation.opacity -= 0.01;
          animation.scale -= 0.005;
        }

        ctx.save();
        ctx.font = '20px monospace';
        ctx.fillStyle = `rgba(61, 255, 154, ${animation.opacity})`;
        ctx.translate(animation.x, animation.y);
        ctx.scale(animation.scale, animation.scale);
        ctx.fillText(animation.name, -ctx.measureText(animation.name).width / 2, 0);
        ctx.restore();

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
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-[600px]"
      style={{ opacity: 0.3 }}
    />
  );
}