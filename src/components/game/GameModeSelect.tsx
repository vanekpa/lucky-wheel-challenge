import { Button } from '@/components/ui/button';
import { Shuffle, BookOpen, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GameModeSelectProps {
  onSelectRandom: () => void;
  onSelectTeacher: () => void;
}

// Animated background wheel SVG
const BackgroundWheel = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
    <svg
      viewBox="0 0 400 400"
      className="w-[800px] h-[800px] opacity-10 animate-[spin_60s_linear_infinite]"
    >
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16;
        const colors = ['#fe3d2f', '#3b69ee', '#e741e8', '#fed815', '#409b7b', '#ff6b35', '#8b5cf6', '#06b6d4'];
        return (
          <path
            key={i}
            d={`M200,200 L200,0 A200,200 0 0,1 ${200 + 200 * Math.sin((Math.PI * 2) / 16)},${200 - 200 * Math.cos((Math.PI * 2) / 16)} Z`}
            fill={colors[i % colors.length]}
            transform={`rotate(${angle} 200 200)`}
          />
        );
      })}
      <circle cx="200" cy="200" r="40" fill="#1a1a2e" stroke="#ffd700" strokeWidth="4" />
    </svg>
  </div>
);

// Floating light particles
const FloatingParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-yellow-400/30 animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 3}s`,
        }}
      />
    ))}
  </div>
);

export const GameModeSelect = ({ onSelectRandom, onSelectTeacher }: GameModeSelectProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3e] to-[#2a1a4a] p-8 relative overflow-hidden">
      {/* Animated spotlight effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-pink-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      <BackgroundWheel />
      <FloatingParticles />

      {/* Title with neon glow effect */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-top duration-1000 relative z-10">
        <div className="relative inline-block">
          <h1 
            className="text-8xl md:text-9xl font-black tracking-tighter mb-4"
            style={{
              background: 'linear-gradient(135deg, #ffd700 0%, #ff6b35 25%, #ff1493 50%, #00ffff 75%, #ffd700 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-shift 4s ease infinite',
              textShadow: '0 0 80px rgba(255,215,0,0.5)',
              filter: 'drop-shadow(0 0 30px rgba(255,105,180,0.4))',
            }}
          >
            KOLOTOČ
          </h1>
          {/* Glow layer behind text */}
          <h1 
            className="absolute inset-0 text-8xl md:text-9xl font-black tracking-tighter mb-4 blur-sm opacity-50"
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ff1493, #00ffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            aria-hidden="true"
          >
            KOLOTOČ
          </h1>
        </div>
        <p className="text-2xl md:text-3xl text-white/60 font-light tracking-wide">
          Slovní hra inspirovaná <span className="text-yellow-400/80 font-medium">Kolem štěstí</span>
        </p>
      </div>

      {/* Game mode buttons */}
      <div className="flex flex-col sm:flex-row gap-8 mb-16 animate-in fade-in slide-in-from-bottom duration-1000 delay-300 relative z-10">
        <Button
          onClick={onSelectRandom}
          size="lg"
          className="group relative overflow-hidden text-2xl px-14 py-12 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 hover:from-emerald-400 hover:via-green-500 hover:to-teal-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] border-2 border-emerald-400/50 rounded-3xl transition-all duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(16,185,129,0.6)]"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Shuffle className="h-14 w-14" />
            </div>
            <span className="font-bold text-3xl">Rychlá hra</span>
            <span className="text-base opacity-70 font-normal">Náhodné tajenky z databáze</span>
          </div>
        </Button>

        <Button
          onClick={onSelectTeacher}
          size="lg"
          className="group relative overflow-hidden text-2xl px-14 py-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 hover:from-blue-400 hover:via-indigo-500 hover:to-purple-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] border-2 border-blue-400/50 rounded-3xl transition-all duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <BookOpen className="h-14 w-14" />
            </div>
            <span className="font-bold text-3xl">Učitelský mód</span>
            <span className="text-base opacity-70 font-normal">Vlastní tajenky pro třídu</span>
          </div>
        </Button>
      </div>

      {/* Admin link */}
      <Link 
        to="/auth" 
        className="relative z-10 text-white/40 hover:text-white/80 transition-all duration-300 flex items-center gap-2 text-sm animate-in fade-in duration-1000 delay-700 hover:scale-105"
      >
        <Lock className="h-4 w-4" />
        Správa tajenek
      </Link>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};
