import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    const centerX = 300;
    const centerY = 300;
    const radius = 240;
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
    const radius = 160;
    const x = 300 + radius * Math.cos(angle);
    const y = 300 + radius * Math.sin(angle);
    const rotation = index * segmentAngle + segmentAngle / 2;
    return { x, y, rotation };
  };

  // Get token position on segment
  const getTokenPosition = (index: number) => {
    const angle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
    const radius = 200;
    const x = 300 + radius * Math.cos(angle);
    const y = 300 + radius * Math.sin(angle);
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
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-[600px] h-[600px]">
        {/* Wheel pointer - fixed at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[25px] border-r-[25px] border-t-[50px] border-l-transparent border-r-transparent border-t-primary drop-shadow-2xl" 
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
        />
        
        {/* Wheel container - rotates */}
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'none' : 'transform 4s cubic-bezier(0.17, 0.67, 0.3, 0.96)',
          }}
        >
          <svg viewBox="0 0 600 600" className="w-full h-full drop-shadow-2xl">
            {/* Outer ring */}
            <circle cx="300" cy="300" r="245" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
            
            {/* Segments */}
            {wheelSegments.map((segment, index) => {
              const textPos = getTextPosition(index);
              const isHovered = hoveredSegment === segment.id;
              const hasToken = tokenPositions.has(segment.id);
              const tokenPos = getTokenPosition(index);
              
              return (
                <g key={segment.id}>
                  {/* Segment path */}
                  <path
                    d={getSegmentPath(index)}
                    fill={`hsl(var(--${segment.color}))`}
                    stroke="white"
                    strokeWidth="3"
                    className={`transition-opacity ${
                      placingTokensMode && segment.type !== 'bankrot' ? 'cursor-pointer hover:opacity-80' : ''
                    } ${isHovered && placingTokensMode ? 'opacity-80' : ''}`}
                    onClick={() => handleSegmentClick(segment.id)}
                    onMouseEnter={() => placingTokensMode && setHoveredSegment(segment.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{
                      filter: hasToken ? 'brightness(1.1)' : 'none'
                    }}
                  />
                  
                  {/* Segment value text */}
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

                  {/* Token on segment */}
                  {hasToken && tokenPositions.get(segment.id) !== undefined && (
                    <g>
                      <circle
                        cx={tokenPos.x}
                        cy={tokenPos.y}
                        r="20"
                        fill={players[tokenPositions.get(segment.id)!]?.color || 'white'}
                        stroke="white"
                        strokeWidth="3"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                          pointerEvents: 'none'
                        }}
                      />
                      <text
                        x={tokenPos.x}
                        y={tokenPos.y}
                        fill="white"
                        fontSize="16"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          pointerEvents: 'none',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                        }}
                      >
                        {tokenPositions.get(segment.id)! + 1}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Pegs around the wheel */}
            {Array.from({ length: wheelSegments.length }).map((_, index) => {
              const angle = (index * segmentAngle - 90) * (Math.PI / 180);
              const radius = 245;
              const x = 300 + radius * Math.cos(angle);
              const y = 300 + radius * Math.sin(angle);
              
              return (
                <circle
                  key={`peg-${index}`}
                  cx={x}
                  cy={y}
                  r="8"
                  fill="hsl(var(--muted))"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  style={{
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))'
                  }}
                />
              );
            })}

            {/* Center circle */}
            <circle cx="300" cy="300" r="70" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="6" />
            <circle cx="300" cy="300" r="55" fill="hsl(var(--primary))" />
            <text
              x="300"
              y="300"
              fill="hsl(var(--primary-foreground))"
              fontSize="40"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              ★
            </text>
          </svg>
        </div>
      </div>

      {!placingTokensMode && (
        <Button
          onClick={spinWheel}
          disabled={disabled || isSpinning}
          size="lg"
          className="text-xl px-12 py-6 font-bold"
        >
          {isSpinning ? 'TOČÍM...' : 'ROZTOČIT KOLO'}
        </Button>
      )}

      {placingTokensMode && currentPlayer !== undefined && (
        <div className="text-center">
          <p className="text-2xl font-bold mb-2" style={{ color: players[currentPlayer].color }}>
            {players[currentPlayer].name}
          </p>
          <p className="text-lg text-muted-foreground">
            Klikněte na segment pro umístění žetonu
          </p>
        </div>
      )}
    </div>
  );
};
