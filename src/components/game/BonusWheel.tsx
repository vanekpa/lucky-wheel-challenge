import { useState, useRef, useEffect } from 'react';
import { Player, WheelSegment, BonusWheelState } from '@/types/game';
import { bonusWheelSegments } from '@/data/puzzles';
import { Button } from '@/components/ui/button';
import { playTickSound, playBonusDrumroll, playJackpotSound, playRevealSound, playVictoryFanfare, playBankruptSound, playNothingSound } from '@/utils/sounds';

interface BonusWheelProps {
  winner: Player;
  players: Player[];
  onComplete: (finalScores: Player[]) => void;
}

const BonusWheel = ({ winner, players, onComplete }: BonusWheelProps) => {
  const [phase, setPhase] = useState<BonusWheelState['phase']>('intro');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [initialSegmentIndex, setInitialSegmentIndex] = useState(0);
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [revealedSegments, setRevealedSegments] = useState<Set<number>>(new Set());
  const wheelRotationRef = useRef(0);

  const colorMap: Record<string, string> = {
    'wheel-red': '#fe3d2f',
    'wheel-blue': '#3b69ee',
    'wheel-purple': '#e741e8',
    'wheel-yellow': '#fed815',
    'wheel-green': '#409b7b',
    'wheel-gold': '#ffd700',
    'bankrot': '#1a1a1a',
    'nic': '#333344',
  };

  const handleStartSpin = () => {
    setPhase('spin');
    setIsSpinning(true);
    playBonusDrumroll();

    const targetSegmentIndex = Math.floor(Math.random() * 32);
    setInitialSegmentIndex(targetSegmentIndex);

    const extraSpins = 6;
    const segmentAngle = (Math.PI * 2) / 32;
    const currentRotation = wheelRotationRef.current;

    const segmentCenterAngle = targetSegmentIndex * segmentAngle + segmentAngle / 2;
    const pointerPos = 3 * Math.PI / 2;
    const geometryOffset = -Math.PI / 2;
    const targetRotationInCircle = pointerPos - segmentCenterAngle - geometryOffset;

    const normalizedTarget = ((targetRotationInCircle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const fullRotations = Math.floor(currentRotation / (Math.PI * 2)) * (Math.PI * 2);
    const newRotation = fullRotations + (Math.PI * 2 * extraSpins) + normalizedTarget;

    const duration = 5000; // Slower for dramatic effect
    const startTime = Date.now();
    const startRotation = currentRotation;
    let lastSegmentIndex = -1;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease = 1 - Math.pow(1 - progress, 5);
      const currentRot = startRotation + (newRotation - startRotation) * ease;

      const currentSegmentIdx = Math.floor(((currentRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / segmentAngle) % 32;
      if (currentSegmentIdx !== lastSegmentIndex && progress < 0.95) {
        playTickSound();
        lastSegmentIndex = currentSegmentIdx;
      }

      wheelRotationRef.current = currentRot;
      setWheelRotation(currentRot);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        wheelRotationRef.current = newRotation;
        setWheelRotation(newRotation);
        setIsSpinning(false);
        
        // Transition to blackout after spin
        setTimeout(() => {
          setPhase('blackout');
          setTimeout(() => {
            setPhase('choice');
          }, 1500);
        }, 500);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleSelectOffset = (offset: number) => {
    setSelectedOffset(offset);
  };

  const handleConfirmChoice = () => {
    setPhase('reveal');
    playRevealSound();

    // Calculate final segment
    const finalIndex = ((initialSegmentIndex + selectedOffset) % 32 + 32) % 32;
    
    // Reveal segments one by one
    const revealOrder = [];
    for (let i = 0; i <= Math.abs(selectedOffset); i++) {
      const step = selectedOffset >= 0 ? i : -i;
      const segIdx = ((initialSegmentIndex + step) % 32 + 32) % 32;
      revealOrder.push(segIdx);
    }

    revealOrder.forEach((segIdx, i) => {
      setTimeout(() => {
        playRevealSound();
        setRevealedSegments(prev => new Set([...prev, segIdx]));
        
        if (i === revealOrder.length - 1) {
          // Final reveal
          setTimeout(() => {
            setPhase('result');
            const segment = bonusWheelSegments[finalIndex];
            
            if (segment.type === 'jackpot') {
              playJackpotSound();
            } else if (segment.type === 'bankrot') {
              playBankruptSound();
            } else if (segment.type === 'nic') {
              playNothingSound();
            } else {
              playVictoryFanfare();
            }
          }, 800);
        }
      }, i * 600);
    });
  };

  const getFinalResult = () => {
    const finalIndex = ((initialSegmentIndex + selectedOffset) % 32 + 32) % 32;
    const segment = bonusWheelSegments[finalIndex];
    
    let bonusPoints = 0;
    let resultText = '';

    if (segment.type === 'jackpot') {
      bonusPoints = winner.score * 3;
      resultText = `🎰 JACKPOT! 3× skóre = +${bonusPoints.toLocaleString()} bodů!`;
    } else if (segment.type === 'bankrot') {
      bonusPoints = -winner.score;
      resultText = '💀 BANKROT! Všechny body ztraceny!';
    } else if (segment.type === 'nic') {
      bonusPoints = 0;
      resultText = '😐 NIC - žádná změna';
    } else {
      bonusPoints = segment.value as number;
      resultText = `🎉 +${bonusPoints.toLocaleString()} bodů!`;
    }

    return { bonusPoints, resultText, segment };
  };

  const handleFinish = () => {
    const { bonusPoints } = getFinalResult();
    
    const updatedPlayers = players.map(p => 
      p.id === winner.id 
        ? { ...p, score: Math.max(0, p.score + bonusPoints) }
        : p
    );

    onComplete(updatedPlayers);
  };

  const renderWheel = () => {
    const isBlackout = phase === 'blackout' || phase === 'choice';
    
    return (
      <div className="relative w-80 h-80 md:w-96 md:h-96">
        {/* Wheel */}
        <svg 
          viewBox="-110 -110 220 220" 
          className="w-full h-full"
          style={{ transform: `rotate(${wheelRotation}rad)` }}
        >
          {bonusWheelSegments.map((segment, index) => {
            const angle = (Math.PI * 2) / 32;
            const startAngle = index * angle - Math.PI / 2;
            const endAngle = startAngle + angle;
            
            const x1 = Math.cos(startAngle) * 100;
            const y1 = Math.sin(startAngle) * 100;
            const x2 = Math.cos(endAngle) * 100;
            const y2 = Math.sin(endAngle) * 100;
            
            // Calculate text position - text sits on a radius line pointing outward
            const midAngle = startAngle + angle / 2;
            const textRadius = 65;
            const textX = Math.cos(midAngle) * textRadius;
            const textY = Math.sin(midAngle) * textRadius;
            
            // Text rotation (SVG): make text readable from outside without conditional flips
            // Coordinate system note: our wheel starts at -90° (top), so we offset by -90°.
            const midAngleDeg = (midAngle * 180) / Math.PI;
            const textRotation = -midAngleDeg - 90;
            
            const isRevealed = revealedSegments.has(index);
            const showBlack = isBlackout && !isRevealed;
            
            return (
              <g key={segment.id}>
                <path
                  d={`M 0 0 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                  fill={showBlack ? '#111' : colorMap[segment.color]}
                  stroke="#222"
                  strokeWidth="1"
                  className={isRevealed ? 'animate-reveal-pulse' : ''}
                />
                {!showBlack && (
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  >
                    {typeof segment.value === 'number' ? (segment.value / 1000) + 'K' : segment.value}
                  </text>
                )}
                {showBlack && (
                  <text
                    x={textX}
                    y={textY}
                    fill="#555"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    ?
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Center */}
          <circle cx="0" cy="0" r="20" fill="#222" stroke="#ffd700" strokeWidth="3" />
          <text x="0" y="0" fill="#ffd700" fontSize="8" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
            BONUS
          </text>
        </svg>
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-primary drop-shadow-lg" />
        </div>
      </div>
    );
  };

  const renderStepButtons = () => {
    const steps = [-3, -2, -1, 0, 1, 2, 3];
    
    return (
      <div className="flex flex-col items-center gap-4 mt-6">
        <p className="text-lg text-muted-foreground">Vyber posun:</p>
        <div className="flex gap-2">
          {steps.map(step => {
            const targetIndex = ((initialSegmentIndex + step) % 32 + 32) % 32;
            const isSelected = selectedOffset === step;
            
            return (
              <Button
                key={step}
                onClick={() => handleSelectOffset(step)}
                variant={isSelected ? 'default' : 'outline'}
                className={`w-14 h-14 text-lg font-bold ${isSelected ? 'animate-bonus-glow' : ''}`}
              >
                {step > 0 ? `+${step}` : step}
              </Button>
            );
          })}
        </div>
        
        <Button 
          onClick={handleConfirmChoice}
          className="mt-4 px-8 py-4 text-xl animate-bonus-glow"
          size="lg"
        >
          POTVRDIT VÝBĚR
        </Button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background/95 to-primary/20 flex flex-col items-center justify-center p-4">
      {/* Intro Phase */}
      {phase === 'intro' && (
        <div className="text-center animate-in fade-in duration-500">
          <h1 className="text-5xl md:text-7xl font-bold text-primary mb-4 animate-victory-pulse">
            🎰 BONUS KOLO 🎰
          </h1>
          <div className="mb-8">
            <p className="text-2xl text-muted-foreground mb-2">Vítěz:</p>
            <p className="text-4xl font-bold" style={{ color: winner.color }}>
              {winner.name}
            </p>
            <p className="text-3xl text-primary mt-2">
              {winner.score.toLocaleString()} bodů
            </p>
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md mx-auto border border-primary/30">
            <h2 className="text-xl font-bold text-primary mb-3">Pravidla:</h2>
            <ul className="text-left text-muted-foreground space-y-2">
              <li>• Zatoč kolem - hodnoty jsou 20× větší!</li>
              <li>• Po zatočení se vše zčerná</li>
              <li>• Vyber 1-3 kroky vpřed nebo vzad</li>
              <li>• Odkryj svou finální výhru!</li>
              <li className="text-destructive">• POZOR: 8× BANKROT, 5× NIC</li>
              <li className="text-wheel-gold font-bold">• 🎰 JACKPOT = 3× tvé skóre!</li>
            </ul>
          </div>
          
          <Button 
            onClick={() => setPhase('ready')}
            className="px-12 py-6 text-2xl animate-bonus-glow"
            size="lg"
          >
            POKRAČOVAT K BONUS KOLU
          </Button>
        </div>
      )}

      {/* Ready Phase - Wheel stationary, values visible */}
      {phase === 'ready' && (
        <div className="text-center animate-in fade-in duration-500">
          <h2 className="text-3xl font-bold text-primary mb-6">
            Připraven? Zatoč kolem!
          </h2>
          
          {renderWheel()}
          
          <Button 
            onClick={handleStartSpin}
            className="mt-8 px-12 py-6 text-2xl animate-bonus-glow"
            size="lg"
          >
            ROZTOČIT
          </Button>
        </div>
      )}

      {/* Spin Phase */}
      {(phase === 'spin' || phase === 'blackout' || phase === 'choice' || phase === 'reveal') && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">
            {phase === 'spin' && 'Kolo se točí...'}
            {phase === 'blackout' && 'Hodnoty se skrývají...'}
            {phase === 'choice' && 'Vyber svůj osud!'}
            {phase === 'reveal' && 'Odhalování...'}
          </h2>
          
          {renderWheel()}
          
          {phase === 'choice' && renderStepButtons()}
        </div>
      )}

      {/* Result Phase */}
      {phase === 'result' && (
        <div className="text-center animate-in fade-in duration-500">
          <div className="mb-8">
            {renderWheel()}
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 border border-primary/30 mb-8">
            <h2 className="text-4xl font-bold mb-4">
              {getFinalResult().resultText}
            </h2>
            
            <div className="text-2xl text-muted-foreground">
              <span>Původní skóre: {winner.score.toLocaleString()}</span>
              <span className="mx-4">→</span>
              <span className="text-primary font-bold">
                Finální: {Math.max(0, winner.score + getFinalResult().bonusPoints).toLocaleString()}
              </span>
            </div>
          </div>
          
          <Button
            onClick={handleFinish}
            className="px-12 py-6 text-2xl"
            size="lg"
          >
            ZOBRAZIT VÝSLEDKY
          </Button>
        </div>
      )}
    </div>
  );
};

export default BonusWheel;