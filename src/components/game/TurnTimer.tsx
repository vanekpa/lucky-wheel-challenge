import { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

interface TurnTimerProps {
  duration: number;
  isActive: boolean;
  onTimeUp: () => void;
  onWarning?: () => void;
  onReset?: number;
}

export const TurnTimer = ({ 
  duration, 
  isActive, 
  onTimeUp, 
  onWarning,
  onReset
}: TurnTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const warningFiredRef = useRef(false);

  useEffect(() => {
    setTimeLeft(duration);
    warningFiredRef.current = false;
  }, [duration, onReset]);

  useEffect(() => {
    if (!isActive || duration === 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        // Fire warning when hitting 5 seconds (once per timer cycle)
        if (prev === 6 && !warningFiredRef.current) {
          warningFiredRef.current = true;
          onWarning?.();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, duration, onTimeUp, onWarning, onReset]);

  if (!isActive || duration === 0) return null;

  const percentage = (timeLeft / duration) * 100;
  const isWarning = timeLeft <= 5;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
          isWarning
            ? 'bg-red-500/80 border-red-400/50 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            : 'bg-black/70 border-white/20 shadow-lg'
        }`}
      >
        <Timer className={`w-4 h-4 ${isWarning ? 'text-white' : 'text-primary'}`} />
        <span className={`text-xl font-bold tabular-nums ${isWarning ? 'text-white' : 'text-foreground'}`}>
          {timeLeft}s
        </span>
      </div>
      
      <div className="h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden w-full max-w-[100px]">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isWarning ? 'bg-red-500' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
