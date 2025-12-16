import { useEffect, useState } from 'react';

export const StudioEffects = () => {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 8,
      size: 2 + Math.random() * 4,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Animated spotlight beams */}
      <div className="absolute top-0 left-0 w-full h-full">
        {/* Left spotlight */}
        <div 
          className="absolute top-0 -left-20 w-[400px] h-[600px] opacity-[0.08] animate-spotlight-left"
          style={{
            background: 'conic-gradient(from 45deg at 0% 0%, transparent 0deg, hsl(var(--primary)) 20deg, transparent 40deg)',
            transformOrigin: 'top left',
          }}
        />
        
        {/* Right spotlight */}
        <div 
          className="absolute top-0 -right-20 w-[400px] h-[600px] opacity-[0.08] animate-spotlight-right"
          style={{
            background: 'conic-gradient(from 135deg at 100% 0%, transparent 0deg, hsl(var(--primary)) 20deg, transparent 40deg)',
            transformOrigin: 'top right',
          }}
        />
        
        {/* Center top spotlight */}
        <div 
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.05] animate-pulse-slow"
          style={{
            background: 'radial-gradient(ellipse at top, hsl(var(--primary) / 0.3), transparent 70%)',
          }}
        />
      </div>

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/40 animate-float-up"
          style={{
            left: `${particle.left}%`,
            bottom: '-20px',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            boxShadow: `0 0 ${particle.size * 2}px hsl(var(--primary) / 0.3)`,
          }}
        />
      ))}

      {/* Neon accent lines */}
      <div className="absolute bottom-32 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse-slow" />
      <div className="absolute top-1/3 left-0 w-[100px] h-[1px] bg-gradient-to-r from-primary/30 to-transparent animate-pulse-slow" />
      <div className="absolute top-1/3 right-0 w-[100px] h-[1px] bg-gradient-to-l from-primary/30 to-transparent animate-pulse-slow" />
      
      {/* Corner glow effects */}
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] opacity-30">
        <div 
          className="w-full h-full animate-pulse-slow"
          style={{
            background: 'radial-gradient(circle at bottom left, hsl(var(--primary) / 0.15), transparent 60%)',
          }}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] opacity-30">
        <div 
          className="w-full h-full animate-pulse-slow"
          style={{
            background: 'radial-gradient(circle at bottom right, hsl(var(--primary) / 0.15), transparent 60%)',
          }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};
