import { Button } from '@/components/ui/button';
import { EyeOff, Eye } from 'lucide-react';
import { useState } from 'react';

interface DeviceHandoverProps {
  puzzleCount?: number;
  onContinue: () => void;
}

export const DeviceHandover = ({ onContinue }: DeviceHandoverProps) => {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 p-8">
      <div className="text-center max-w-xl animate-in zoom-in duration-500">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl shadow-orange-500/50 animate-pulse">
            <EyeOff className="h-16 w-16 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-black text-white mb-4">
          Pozor!
        </h1>
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">
          UČITELSKÝ MÓD
        </h2>

        {/* Info */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/20">
          <p className="text-white/80 text-lg mb-4">
            V dalším kroku budete zadávat tajenky.
          </p>
          <p className="text-white/60">
            Ujistěte se, že hráči nevidí obrazovku,
            <br />
            aby neprozradili tajná hesla.
          </p>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-center justify-center gap-3 mb-8 cursor-pointer group">
          <div 
            onClick={() => setConfirmed(!confirmed)}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
              confirmed 
                ? 'bg-green-500 border-green-400' 
                : 'bg-white/10 border-white/30 group-hover:border-white/50'
            }`}
          >
            {confirmed && <Eye className="h-5 w-5 text-white" />}
          </div>
          <span className="text-white/80 text-lg">
            Hráči nevidí obrazovku
          </span>
        </label>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          disabled={!confirmed}
          size="lg"
          className="text-2xl px-16 py-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-2xl shadow-green-500/30 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:scale-95"
        >
          Pokračovat k zadání tajenek
        </Button>
      </div>
    </div>
  );
};
