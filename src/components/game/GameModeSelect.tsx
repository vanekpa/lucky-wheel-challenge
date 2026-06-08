import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle, BookOpen, Lock, Info, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GameModeSelectProps {
  onSelectRandom: () => void;
  onSelectTeacher: () => void;
}

// Animated background wheel SVG
const BackgroundWheel = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
    <svg viewBox="0 0 400 400" className="w-[800px] h-[800px] opacity-10 animate-[spin_60s_linear_infinite]">
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16;
        const colors = ["#fe3d2f", "#3b69ee", "#e741e8", "#fed815", "#409b7b", "#ff6b35", "#8b5cf6", "#06b6d4"];
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

// Collapsible game info section
const GameInfoSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative z-10 w-full max-w-2xl animate-in fade-in duration-1000 delay-500">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-center gap-2 text-white/60 hover:text-white/90 transition-colors py-3 group">
            <Info className="w-5 h-5" />
            <span className="font-medium">Pravidla hry</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mt-2 text-sm space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">🎲 Průběh tahu</h3>
                <p className="text-white/70">Roztočte kolo → Vyberte písmeno → Za každý výskyt získáte body</p>
              </div>
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">⚠️ Speciální políčka</h3>
                <p className="text-white/70">
                  <span className="text-red-400 font-bold">BANKROT</span> = ztráta bodů, 
                  <span className="text-gray-400 font-bold"> NIC</span> = další hráč
                </p>
              </div>
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">🔤 Samohlásky</h3>
                <p className="text-white/70">A, E, I, O, U, Y můžete hádat až od <span className="text-yellow-300 font-bold">1000 bodů</span></p>
              </div>
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">🪙 Žetony na kole</h3>
                <p className="text-white/70">Cizí žeton na políčku = majitel získá <span className="text-green-400 font-bold">+2000 bodů</span></p>
              </div>
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">🧠 Paměťová výzva</h3>
                <p className="text-white/70">Použitá písmena nejsou označená – pamatujte si je!</p>
              </div>
              <div>
                <h3 className="font-bold text-yellow-400 mb-1">💡 Hádat tajenku</h3>
                <p className="text-white/70">
                  Bonus = <span className="text-yellow-300 font-bold">1000 × skrytá písmena</span>. 
                  <span className="text-red-400 font-bold"> Špatný tip = ztráta VŠECH bodů!</span>
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export const GameModeSelect = ({ onSelectRandom, onSelectTeacher }: GameModeSelectProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3e] to-[#2a1a4a] p-8 relative overflow-hidden">
      {/* Animated spotlight effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-0 w-64 h-64 bg-pink-500/15 rounded-full blur-[100px] animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <BackgroundWheel />
      <FloatingParticles />

      {/* Title with neon glow effect */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-top duration-1000 relative z-10">
        <div className="relative inline-block">
          <h1
            className="text-8xl md:text-9xl font-black tracking-tighter mb-4"
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ff6b35 25%, #ff1493 50%, #00ffff 75%, #ffd700 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "gradient-shift 4s ease infinite",
              textShadow: "0 0 80px rgba(255,215,0,0.5)",
              filter: "drop-shadow(0 0 30px rgba(255,105,180,0.4))",
            }}
          >
            KOLOTOČ
            <span className="sr-only"> — Vzdělávací soutěž pro školy</span>
          </h1>
          {/* Glow layer behind text */}
          <h1
            className="absolute inset-0 text-8xl md:text-9xl font-black tracking-tighter mb-4 blur-sm opacity-50"
            style={{
              background: "linear-gradient(135deg, #ffd700, #ff1493, #00ffff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            aria-hidden="true"
          >
            KOLOTOČ
          </h1>
        </div>
        <p className="text-2xl md:text-3xl text-white/60 font-light tracking-wide">
          Návrat Pavla Poulíčka! <span className="text-yellow-400/80 font-medium">Hádej a vyhraj!</span>
        </p>
      </div>

      {/* Game mode buttons */}
      <div className="flex flex-col sm:flex-row gap-8 mb-16 animate-in fade-in slide-in-from-bottom duration-1000 delay-300 relative z-10">
        <Button
          onClick={onSelectRandom}
          size="lg"
          className="group relative overflow-hidden px-12 py-8 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 hover:from-emerald-400 hover:via-green-500 hover:to-teal-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] border-2 border-emerald-400/50 rounded-3xl transition-all duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(16,185,129,0.6)]"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <Shuffle className="h-10 w-10" />
            <div className="flex flex-col items-start">
              <span className="font-bold text-2xl">Rychlá hra</span>
              <span className="text-sm opacity-70 font-normal">Náhodné tajenky z databáze</span>
            </div>
          </div>
        </Button>

        <Button
          onClick={onSelectTeacher}
          size="lg"
          className="group relative overflow-hidden px-12 py-8 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 hover:from-blue-400 hover:via-indigo-500 hover:to-purple-600 text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] border-2 border-blue-400/50 rounded-3xl transition-all duration-500 hover:scale-105 hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <BookOpen className="h-10 w-10" />
            <div className="flex flex-col items-start">
              <span className="font-bold text-2xl">Učitelský mód</span>
              <span className="text-sm opacity-70 font-normal">Vlastní tajenky pro třídu</span>
            </div>
          </div>
        </Button>
      </div>

      {/* Game info collapsible */}
      <GameInfoSection />

      <div className="relative z-10 flex items-center gap-6 mt-6 animate-in fade-in duration-1000 delay-700">
        <Link
          to="/jak-hrat"
          className="text-white/40 hover:text-white/80 transition-all duration-300 flex items-center gap-2 text-sm hover:scale-105"
        >
          <GraduationCap className="h-4 w-4" />
          Kolo štěstí ve výuce
        </Link>
        <Link
          to="/auth"
          className="text-white/40 hover:text-white/80 transition-all duration-300 flex items-center gap-2 text-sm hover:scale-105"
        >
          <Lock className="h-4 w-4" />
          Správa tajenek
        </Link>
      </div>

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
