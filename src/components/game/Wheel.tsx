import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { wheelSegments } from '@/data/puzzles';
import { WheelSegment } from '@/types/game';

interface WheelProps {
  onSpinComplete: (segment: WheelSegment) => void;
  isSpinning: boolean;
  disabled?: boolean;
}

export const Wheel = ({ onSpinComplete, isSpinning, disabled }: WheelProps) => {
  const [rotation, setRotation] = useState(0);
  const segmentAngle = 360 / wheelSegments.length;

  const spinWheel = () => {
    if (disabled || isSpinning) return;

    // Random final position with multiple rotations
    const spins = 5 + Math.random() * 3;
    const finalSegment = Math.floor(Math.random() * wheelSegments.length);
    const finalRotation = spins * 360 + finalSegment * segmentAngle;

    setRotation(finalRotation);

    // Call completion after animation
    setTimeout(() => {
      const selectedSegment = wheelSegments[finalSegment];
      onSpinComplete(selectedSegment);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-[500px] h-[500px]">
        {/* Wheel pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
        
        {/* Wheel container */}
        <div
          className={`relative w-full h-full rounded-full shadow-2xl ${
            isSpinning ? 'animate-spin-wheel' : ''
          }`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'none' : 'transform 4s cubic-bezier(0.17, 0.67, 0.3, 0.96)',
          }}
        >
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-card rounded-full border-4 border-primary shadow-lg z-10 flex items-center justify-center">
            <div className="text-2xl font-bold text-primary">★</div>
          </div>

          {/* Segments */}
          {wheelSegments.map((segment, index) => {
            const angle = index * segmentAngle;
            return (
              <div
                key={segment.id}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  transform: `rotate(${angle}deg)`,
                  width: '50%',
                  height: '2px',
                }}
              >
                <div
                  className={`absolute top-0 left-0 w-full h-0 border-t-[250px] border-l-[250px] border-l-transparent bg-${segment.color}`}
                  style={{
                    transformOrigin: 'left center',
                    clipPath: `polygon(0 0, 100% 0, 100% 100%)`,
                    backgroundColor: `hsl(var(--${segment.color}))`,
                  }}
                >
                  {/* Segment value text */}
                  <div
                    className="absolute text-white font-bold text-2xl"
                    style={{
                      top: '-180px',
                      left: '80px',
                      transform: `rotate(${segmentAngle / 2}deg)`,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {segment.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Button
        onClick={spinWheel}
        disabled={disabled || isSpinning}
        size="lg"
        className="text-xl px-12 py-6 font-bold"
      >
        {isSpinning ? 'TOČÍM...' : 'ROZTOČIT KOLO'}
      </Button>
    </div>
  );
};
