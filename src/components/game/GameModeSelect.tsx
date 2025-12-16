import { Button } from '@/components/ui/button';
import { Dices, GraduationCap, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GameModeSelectProps {
  onSelectRandom: () => void;
  onSelectTeacher: () => void;
}

export const GameModeSelect = ({ onSelectRandom, onSelectTeacher }: GameModeSelectProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-8">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 mb-4 drop-shadow-2xl tracking-tight">
          KOLOTOČ
        </h1>
        <p className="text-2xl text-white/70 font-medium">
          Slovní hra inspirovaná Kolem štěstí
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
        <Button
          onClick={onSelectRandom}
          size="lg"
          className="group relative overflow-hidden text-2xl px-12 py-10 bg-gradient-to-br from-green-500 to-emerald-700 hover:from-green-400 hover:to-emerald-600 text-white shadow-2xl shadow-green-500/30 border-2 border-green-400/30 rounded-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex flex-col items-center gap-3">
            <Dices className="h-12 w-12" />
            <span className="font-bold">Rychlá hra</span>
            <span className="text-sm opacity-80 font-normal">Náhodné tajenky</span>
          </div>
        </Button>

        <Button
          onClick={onSelectTeacher}
          size="lg"
          className="group relative overflow-hidden text-2xl px-12 py-10 bg-gradient-to-br from-blue-500 to-indigo-700 hover:from-blue-400 hover:to-indigo-600 text-white shadow-2xl shadow-blue-500/30 border-2 border-blue-400/30 rounded-2xl transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex flex-col items-center gap-3">
            <GraduationCap className="h-12 w-12" />
            <span className="font-bold">Učitelský mód</span>
            <span className="text-sm opacity-80 font-normal">Vlastní tajenky</span>
          </div>
        </Button>
      </div>

      <Link 
        to="/admin" 
        className="text-white/50 hover:text-white/80 transition-colors flex items-center gap-2 text-sm animate-in fade-in duration-700 delay-500"
      >
        <Settings className="h-4 w-4" />
        Správa tajenek
      </Link>
    </div>
  );
};
