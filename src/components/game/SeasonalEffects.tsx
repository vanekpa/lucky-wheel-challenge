import { useEffect, useState } from 'react';
import { useSeason, Season, DayTime } from '@/hooks/useSeason';

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation?: number;
  swing?: number;
}

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
}

const getParticleEmoji = (season: Season): string => {
  switch (season) {
    case 'winter': return '❄️';
    case 'spring': return '🌸';
    case 'summer': return '✨';
    case 'autumn': return '🍂';
  }
};

export const SeasonalEffects = () => {
  const { season, dayTime, effectsEnabled, colors, loading } = useSeason();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    if (!effectsEnabled) return;

    // Generate particles
    const newParticles: Particle[] = [];
    const count = season === 'winter' ? 60 : season === 'autumn' ? 40 : 30;
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 8 + Math.random() * 8,
        size: season === 'winter' ? 8 + Math.random() * 16 : 16 + Math.random() * 20,
        rotation: Math.random() * 360,
        swing: Math.random() * 50 - 25,
      });
    }
    setParticles(newParticles);

    // Generate stars for night mode
    if (dayTime === 'night') {
      const newStars: Star[] = [];
      for (let i = 0; i < 80; i++) {
        newStars.push({
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 60,
          size: 1 + Math.random() * 2,
          delay: Math.random() * 3,
        });
      }
      setStars(newStars);
    } else {
      setStars([]);
    }
  }, [season, dayTime, effectsEnabled]);

  if (loading || !effectsEnabled) return null;

  const emoji = getParticleEmoji(season);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {/* Night stars */}
      {dayTime === 'night' && stars.map((star) => (
        <div
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.5)',
          }}
        />
      ))}

      {/* Moon for night */}
      {dayTime === 'night' && (
        <div 
          className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 opacity-80"
          style={{
            top: '8%',
            right: '15%',
            boxShadow: '0 0 60px 20px rgba(255,255,200,0.3)',
          }}
        />
      )}

      {/* Sun rays for summer day */}
      {season === 'summer' && dayTime === 'day' && (
        <div className="absolute top-0 right-0 w-96 h-96 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-bl from-yellow-300/60 via-orange-200/30 to-transparent animate-sun-ray" />
          <div 
            className="absolute top-10 right-10 w-32 h-32 rounded-full bg-yellow-200"
            style={{ boxShadow: '0 0 100px 50px rgba(255,220,100,0.4)' }}
          />
        </div>
      )}

      {/* Seasonal particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${
            season === 'winter' ? 'animate-snowfall' : 
            season === 'autumn' ? 'animate-leaf-fall' : 
            season === 'spring' ? 'animate-petal-fall' : 
            'animate-sparkle'
          }`}
          style={{
            left: `${particle.left}%`,
            top: '-5%',
            fontSize: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            '--swing': `${particle.swing}px`,
          } as React.CSSProperties}
        >
          {emoji}
        </div>
      ))}

      {/* Winter: additional snow sparkles */}
      {season === 'winter' && (
        <>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                boxShadow: '0 0 4px 1px rgba(255,255,255,0.8)',
              }}
            />
          ))}
        </>
      )}

      {/* Fog effect for autumn */}
      {season === 'autumn' && (
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-orange-900/20 via-amber-800/10 to-transparent" />
      )}

      {/* Spring: floating petals glow */}
      {season === 'spring' && dayTime === 'day' && (
        <div 
          className="absolute top-20 left-20 w-64 h-64 rounded-full opacity-30 animate-pulse-slow"
          style={{
            background: 'radial-gradient(circle, rgba(255,182,193,0.4) 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
};
