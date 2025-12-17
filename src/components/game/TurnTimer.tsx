import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface TurnTimerProps {
  duration: number;
  isActive: boolean;
  onTimeUp: () => void;
  onReset?: number; // Increment to reset timer
}

export const TurnTimer = ({ duration, isActive, onTimeUp, onReset }: TurnTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  // Reset timer when onReset changes or duration changes
  useEffect(() => {
    setTimeLeft(duration);
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
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, duration, onTimeUp, onReset]);

  if (!isActive || duration === 0) return null;

  const percentage = (timeLeft / duration) * 100;
  const isWarning = timeLeft <= 5;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
          isWarning
            ? 'bg-red-500/80 border-red-400/50 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]'
            : 'bg-black/60 border-white/20 shadow-lg'
        }`}
      >
        <Timer className={`w-5 h-5 ${isWarning ? 'text-white' : 'text-primary'}`} />
        <span className={`text-2xl font-bold tabular-nums ${isWarning ? 'text-white' : 'text-foreground'}`}>
          {timeLeft}s
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden mx-2">
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
