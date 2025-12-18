import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinButtonProps {
  onSpin: (power: number) => void;
  disabled?: boolean;
  isSpinning?: boolean;
  playerName?: string;
  playerColor?: string;
  size?: 'normal' | 'compact';
}

const QUICK_TAP_THRESHOLD_MS = 300;
const MIN_POWER = 50; // Minimum guaranteed power
const OSCILLATION_SPEED = 0.4; // Slower oscillation - ~2.5s per cycle

export const SpinButton = ({
  onSpin,
  disabled = false,
  isSpinning = false,
  playerName,
  playerColor = '#6366f1',
  size = 'normal'
}: SpinButtonProps) => {
  const [isCharging, setIsCharging] = useState(false);
  const [powerLevel, setPowerLevel] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  
  const pressStartTime = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Animate power meter oscillation
  const animatePower = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    
    setPowerLevel(prev => {
      let next = prev + direction * OSCILLATION_SPEED * delta * 100;
      
      if (next >= 100) {
        next = 100;
        setDirection(-1);
        // Vibrate at max power
        navigator.vibrate?.([30]);
      } else if (next <= 0) {
        next = 0;
        setDirection(1);
      }
      
      return next;
    });
    
    animationFrameRef.current = requestAnimationFrame(animatePower);
  }, [direction]);
  
  // Start charging
  const handlePressStart = useCallback(() => {
    if (disabled || isSpinning) return;
    
    pressStartTime.current = Date.now();
    setIsCharging(true);
    setPowerLevel(50); // Start at middle
    setDirection(1);
    lastTimeRef.current = 0;
    
    navigator.vibrate?.([20]); // Initial tap feedback
    
    animationFrameRef.current = requestAnimationFrame(animatePower);
  }, [disabled, isSpinning, animatePower]);
  
  // Release and spin
  const handlePressEnd = useCallback(() => {
    if (!isCharging) return;
    
    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const pressDuration = Date.now() - pressStartTime.current;
    
    // Quick tap = 50% power, otherwise use current power level with minimum
    let finalPower: number;
    if (pressDuration < QUICK_TAP_THRESHOLD_MS) {
      finalPower = 50; // Quick tap = normal spin
    } else {
      finalPower = Math.max(MIN_POWER, powerLevel);
    }
    
    setIsCharging(false);
    setPowerLevel(0);
    
    // Vibrate based on power
    const vibrationDuration = 50 + (finalPower / 100) * 100;
    navigator.vibrate?.([vibrationDuration]);
    
    onSpin(finalPower);
  }, [isCharging, powerLevel, onSpin]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Get power bar color based on level
  const getPowerColor = () => {
    if (powerLevel < 30) return 'bg-green-500';
    if (powerLevel < 50) return 'bg-yellow-500';
    if (powerLevel < 70) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const isCompact = size === 'compact';
  const canSpin = !disabled && !isSpinning;
  
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Power meter */}
      {isCharging && (
        <div className="relative h-8 bg-slate-700/60 rounded-full overflow-hidden border-2 border-white/20">
          <div 
            className={cn(
              "h-full transition-all duration-100 rounded-full",
              getPowerColor(),
              powerLevel >= 80 && "animate-pulse"
            )}
            style={{ 
              width: `${powerLevel}%`,
              boxShadow: powerLevel >= 70 ? '0 0 20px #ef4444' : '0 0 10px #22c55e'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white drop-shadow-lg">
              {Math.round(powerLevel)}% SÍLA
            </span>
          </div>
        </div>
      )}
      
      {/* Spin button */}
      <button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={() => isCharging && handlePressEnd()}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={() => isCharging && handlePressEnd()}
        disabled={!canSpin}
        className={cn(
          "rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 relative overflow-hidden select-none touch-none",
          !canSpin && "opacity-50",
          isCompact ? "py-5" : "py-8"
        )}
        style={{ 
          background: canSpin 
            ? `linear-gradient(135deg, ${playerColor} 0%, ${playerColor}bb 100%)` 
            : '#475569',
          boxShadow: canSpin ? `0 8px 30px ${playerColor}40` : undefined
        }}
      >
        {/* Charging animation overlay */}
        {isCharging && (
          <div 
            className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent animate-pulse"
          />
        )}
        
        {/* Spinning animation overlay */}
        {isSpinning && (
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        )}
        
        <RotateCcw 
          className={cn(
            "text-white",
            isCompact ? "w-8 h-8" : "w-12 h-12",
            isSpinning && "animate-spin"
          )} 
        />
        <span className={cn(
          "font-black text-white",
          isCompact ? "text-2xl" : "text-3xl"
        )}>
          {isCharging ? 'NABÍJÍM...' : isSpinning ? 'TOČÍ SE...' : 'ZATOČIT'}
        </span>
        {playerName && (
          <span className="text-sm text-white/70">{playerName}</span>
        )}
        
        {/* Instructions */}
        {!isCharging && !isSpinning && canSpin && (
          <span className="text-[10px] text-white/50 mt-1">
            Držte pro silnější zatočení
          </span>
        )}
      </button>
    </div>
  );
};

export default SpinButton;
