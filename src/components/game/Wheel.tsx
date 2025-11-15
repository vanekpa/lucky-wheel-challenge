import { useState } from 'react';
import { wheelSegments } from '@/data/puzzles';
import { WheelSegment, Player } from '@/types/game';

interface WheelProps {
  onSpinComplete: (segment: WheelSegment) => void;
  isSpinning: boolean;
  disabled?: boolean;
  tokenPositions?: Map<number, number>;
  onSegmentClick?: (segmentId: number) => void;
  placingTokensMode?: boolean;
  players: Player[];
  currentPlayer?: number;
}

export const Wheel = ({ 
  onSpinComplete, 
  isSpinning, 
  disabled, 
  tokenPositions = new Map(),
  onSegmentClick,
  placingTokensMode = false,
  players,
  currentPlayer
}: WheelProps) => {
  const [rotation, setRotation] = useState(0);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const SIZE = 600;
  const segmentAngle = 360 / wheelSegments.length;

  const spinWheel = () => {
    if (disabled || isSpinning) return;

    // Random final position with multiple rotations
    const spins = 5 + Math.random() * 3;
    const finalSegment = Math.floor(Math.random() * wheelSegments.length);
    const finalRotation = rotation + spins * 360 + finalSegment * segmentAngle;

    setRotation(finalRotation);

    // Call completion after animation
    setTimeout(() => {
      const selectedSegment = wheelSegments[finalSegment];
      onSpinComplete(selectedSegment);
    }, 4000);
  };

  // Calculate SVG path for a segment
  const getSegmentPath = (index: number) => {
    const centerX = SIZE / 2;
    const centerY = SIZE / 2;
    const radius = SIZE / 2 - 60;
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  // Calculate text position for a segment
  const getTextPosition = (index: number) => {
    const angle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
    const radius = SIZE / 2 - 140;
    const x = SIZE / 2 + radius * Math.cos(angle);
    const y = SIZE / 2 + radius * Math.sin(angle);
    const rotation = index * segmentAngle + segmentAngle / 2;
    return { x, y, rotation };
  };

  // Get token position on segment
  const getTokenPosition = (index: number) => {
    const angle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
    const radius = SIZE / 2 - 100;
    const x = SIZE / 2 + radius * Math.cos(angle);
    const y = SIZE / 2 + radius * Math.sin(angle);
    return { x, y };
  };

  const handleSegmentClick = (segmentId: number) => {
    if (placingTokensMode && onSegmentClick) {
      const segment = wheelSegments.find(s => s.id === segmentId);
      if (segment?.type !== 'bankrot') {
        onSegmentClick(segmentId);
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-8">
      {placingTokensMode && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 text-center z-10">
          <div className="bg-card/90 backdrop-blur-md px-6 py-3 rounded-lg border-2 border-primary/50">
            <h2 className="text-xl font-bold text-primary mb-1">
              {players[currentPlayer!].name} - Umístěte svůj žeton
            </h2>
            <p className="text-sm text-muted-foreground">
              Klikněte na políčko na kole (kromě BANKROT)
            </p>
          </div>
        </div>
      )}

      {/* 3D Perspective Container */}
      <div 
        className="relative"
        style={{
          perspective: '1200px',
          perspectiveOrigin: 'center center',
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="drop-shadow-2xl transition-transform duration-300"
          style={{
            transform: `rotateX(-35deg) rotateZ(${rotation}deg)`,
            transformStyle: 'preserve-3d',
            transition: isSpinning ? 'none' : 'transform 4s cubic-bezier(0.17, 0.67, 0.3, 0.96)',
          }}
        >
          <defs>
            {/* Gradients for 3D depth effect */}
            {wheelSegments.map((segment) => (
              <linearGradient
                key={`grad-${segment.id}`}
                id={`gradient-${segment.id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={`hsl(var(--${segment.color}))`} stopOpacity="0.8" />
                <stop offset="100%" stopColor={`hsl(var(--${segment.color}))`} stopOpacity="1" />
              </linearGradient>
            ))}
          </defs>

          {/* Outer ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={SIZE / 2 - 55}
            fill="none"
            stroke="white"
            strokeWidth="10"
          />

          <g>
            {/* Segments */}
            {wheelSegments.map((segment, index) => {
              const tokenOwner = tokenPositions.get(segment.id);
              const hasToken = tokenOwner !== undefined;

              return (
                <g key={segment.id}>
                  <path
                    d={getSegmentPath(index)}
                    fill={`url(#gradient-${segment.id})`}
                    stroke="white"
                    strokeWidth="3"
                    className={`transition-all ${
                      placingTokensMode && segment.type !== 'bankrot'
                        ? 'cursor-pointer hover:brightness-125'
                        : ''
                    } ${hoveredSegment === segment.id ? 'brightness-125' : ''}`}
                    onClick={() => handleSegmentClick(segment.id)}
                    onMouseEnter={() => setHoveredSegment(segment.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />

                  {/* Segment text */}
                  {(() => {
                    const textPos = getTextPosition(index);
                    return (
                      <text
                        x={textPos.x}
                        y={textPos.y}
                        fill="white"
                        fontSize={segment.type === 'bankrot' || segment.type === 'nic' ? '16' : '28'}
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textPos.rotation} ${textPos.x} ${textPos.y})`}
                        style={{
                          textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                          pointerEvents: 'none',
                          fontFamily: 'Arial Black, sans-serif',
                          letterSpacing: '1px',
                          paintOrder: 'stroke fill'
                        }}
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth="1"
                      >
                        {segment.value}
                      </text>
                    );
                  })()}

                  {/* Token on segment */}
                  {hasToken && (() => {
                    const tokenPos = getTokenPosition(index);
                    const player = players[tokenOwner];
                    return (
                      <g>
                        <circle
                          cx={tokenPos.x}
                          cy={tokenPos.y}
                          r="22"
                          fill={player.color}
                          stroke="white"
                          strokeWidth="3"
                          filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
                        />
                        <text
                          x={tokenPos.x}
                          y={tokenPos.y}
                          fill="white"
                          fontSize="14"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ pointerEvents: 'none' }}
                        >
                          {tokenOwner + 1}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}

            {/* Center hub */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r="50"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="5"
              filter="drop-shadow(0 4px 12px rgba(0,0,0,0.4))"
            />

            {/* Pegs around the wheel */}
            {Array.from({ length: wheelSegments.length }).map((_, i) => {
              const angle = (i * segmentAngle - 90) * (Math.PI / 180);
              const radius = SIZE / 2 - 60;
              const x = SIZE / 2 + radius * Math.cos(angle);
              const y = SIZE / 2 + radius * Math.sin(angle);

              return (
                <circle
                  key={`peg-${i}`}
                  cx={x}
                  cy={y}
                  r="8"
                  fill="white"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                />
              );
            })}
          </g>
        </svg>

        {/* 3D Pointer Arrow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
          style={{
            transform: 'translateX(-50%) translateY(-20px)',
          }}
        >
          <div className="relative">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-primary drop-shadow-[0_0_20px_hsl(var(--primary))]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {!placingTokensMode && (
        <button
          onClick={spinWheel}
          disabled={disabled || isSpinning}
          className="mt-6 px-12 py-4 bg-primary text-primary-foreground font-bold text-2xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_30px_hsl(var(--primary)_/_0.5)]"
        >
          {isSpinning ? 'TOČÍ SE...' : 'ROZTOČIT KOLO'}
        </button>
      )}
    </div>
  );
};
