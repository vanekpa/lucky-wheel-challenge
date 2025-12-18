import { useState, useEffect, useRef } from 'react';
import { Timer, Loader2 } from 'lucide-react';

interface TurnTimerProps {
  duration: number;
  isActive: boolean;
  onTimeUp: () => void;
  onReset?: number;
  spinDuration?: number; // Duration of spin animation in ms
  isSpinning?: boolean;
}

export const TurnTimer = ({ 
  duration, 
  isActive, 
  onTimeUp, 
  onReset, 
  spinDuration = 0,
  isSpinning = false 
}: TurnTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [spinProgress, setSpinProgress] = useState(0);
  const spinStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration, onReset]);

  // Smooth spin progress animation
  useEffect(() => {
    if (isSpinning && spinDuration > 0) {
      spinStartRef.current = Date.now();
      setSpinProgress(0);

      const animate = () => {
        const elapsed = Date.now() - spinStartRef.current;
        const progress = Math.min(elapsed / spinDuration, 1);
        setSpinProgress(progress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setSpinProgress(0);
    }
  }, [isSpinning, spinDuration]);

  useEffect(() => {
    if (!isActive || duration === 0 || isSpinning) return;

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
  }, [isActive, duration, onTimeUp, onReset, isSpinning]);

  // Show spin progress bar when spinning
  if (isSpinning && spinDuration > 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border bg-primary/20 border-primary/30 shadow-lg">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-xl font-bold tabular-nums text-primary">
            Točím...
          </span>
        </div>
        
        <div className="h-1.5 bg-white/20 rounded-full mt-1.5 overflow-hidden w-full max-w-[120px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/60 transition-none"
            style={{ 
              width: `${spinProgress * 100}%`,
              boxShadow: '0 0 10px hsl(var(--primary) / 0.5)'
            }}
          />
        </div>
      </div>
    );
  }

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
