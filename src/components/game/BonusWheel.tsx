import { useState, useRef, useEffect, useMemo } from 'react';
import { Player, BonusWheelState, WheelSegment } from '@/types/game';
import { bonusWheelSegments } from '@/data/puzzles';
import { Button } from '@/components/ui/button';
import { BonusWheel3D } from './BonusWheel3D';
import { playTickSound, playBonusDrumroll, playJackpotSound, playRevealSound, playVictoryFanfare, playBankruptSound, playNothingSound } from '@/utils/sounds';

interface BonusWheelProps {
  winner: Player;
  players: Player[];
  onComplete: (finalScores: Player[]) => void;
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const BonusWheel = ({ winner, players, onComplete }: BonusWheelProps) => {
  const [phase, setPhase] = useState<BonusWheelState['phase']>('intro');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [initialSegmentIndex, setInitialSegmentIndex] = useState(0);
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [revealedSegments, setRevealedSegments] = useState<Set<number>>(new Set());
  const [pointerBounce, setPointerBounce] = useState(0);
  const [blackoutActive, setBlackoutActive] = useState(false);
  const wheelRotationRef = useRef(0);
  
  // Shuffle segments once when component mounts
  const shuffledSegments = useMemo(() => {
    return shuffleArray(bonusWheelSegments).map((seg, index) => ({
      ...seg,
      id: index // New ID based on shuffled position
    }));
  }, []);

  const handleStartSpin = () => {
    setPhase('spin');
    setIsSpinning(true);
    setBlackoutActive(true); // Blackout immediately when spinning starts
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
        
        // Trigger pointer bounce
        setPointerBounce(1);
        const bounceStart = Date.now();
        const animateBounce = () => {
          const bounceElapsed = Date.now() - bounceStart;
          const bounceProgress = Math.min(bounceElapsed / 500, 1);
          setPointerBounce(1 - bounceProgress);
          if (bounceProgress < 1) {
            requestAnimationFrame(animateBounce);
          }
        };
        requestAnimationFrame(animateBounce);
        
        // Transition to choice phase after spin
        setTimeout(() => {
          setPhase('choice');
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
    
    // Reveal segments one by one using VISUAL OFFSETS from pointer (0 = under pointer)
    // Instead of array indices, we store offsets: 0, +1, +2, +3, -1, -2, -3
    const revealOrder: number[] = [];
    for (let i = 0; i <= Math.abs(selectedOffset); i++) {
      const step = selectedOffset >= 0 ? i : -i;
      revealOrder.push(step); // Visual offset from pointer position
    }

    revealOrder.forEach((visualOffset, i) => {
      setTimeout(() => {
        playRevealSound();
        // Store visual offset, not array index
        setRevealedSegments(prev => new Set([...prev, visualOffset]));
        
        if (i === revealOrder.length - 1) {
          // Final reveal
          setTimeout(() => {
            setPhase('result');
            const segment = shuffledSegments[finalIndex];
            
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
    const segment = shuffledSegments[finalIndex];
    
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
    const isBlackout = blackoutActive && phase !== 'ready';
    
    return (
      <div className="w-80 h-80 md:w-[500px] md:h-[500px]">
        <BonusWheel3D
          rotation={wheelRotation}
          rotationRef={wheelRotationRef}
          blackoutMode={isBlackout}
          revealedSegments={revealedSegments}
          pointerBounce={pointerBounce}
          segments={shuffledSegments}
        />
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
      {(phase === 'spin' || phase === 'choice' || phase === 'reveal') && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">
            {phase === 'spin' && 'Kolo se točí...'}
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