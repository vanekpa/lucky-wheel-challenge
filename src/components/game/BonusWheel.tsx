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

// Calculate visual offset from pointer for a given segment index
const getVisualOffsetFromPointer = (index: number, rotation: number, totalSegments: number): number => {
  const segmentAngle = (Math.PI * 2) / totalSegments;
  const geometryOffset = -Math.PI / 2;
  const pointerPos = 3 * Math.PI / 2; // 270° = top
  
  // Calculate where this segment is visually after rotation
  const segmentCenterAngle = index * segmentAngle + segmentAngle / 2 + geometryOffset;
  const visualAngle = ((segmentCenterAngle - rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  
  // Calculate angular distance from pointer
  let angleDiff = visualAngle - pointerPos;
  // Normalize to -PI to PI
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // Convert to segment offset (inverted: positive = clockwise/right)
  return -Math.round(angleDiff / segmentAngle);
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
    
    // Calculate rotation needed to bring target segment under pointer
    const segmentAngle = (Math.PI * 2) / 32;
    const rotationOffset = selectedOffset * segmentAngle; // How much to rotate
    
    const startRotation = wheelRotationRef.current;
    // Rotate in the direction of offset - positive offset = rotate clockwise (negative rotation)
    const targetRotation = startRotation - rotationOffset;
    
    const duration = 1500 + Math.abs(selectedOffset) * 300; // Longer for more steps
    const startTime = Date.now();
    let lastRevealedStep = -1;
    const totalSteps = Math.abs(selectedOffset);
    
    // Reveal initial segment (under pointer)
    setRevealedSegments(new Set([0]));
    playRevealSound();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing - smooth deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRotation + (targetRotation - startRotation) * ease;
      
      wheelRotationRef.current = currentRot;
      setWheelRotation(currentRot);
      
      // Progressive segment reveal during rotation
      if (totalSteps > 0) {
        const currentStep = Math.floor(progress * totalSteps);
        if (currentStep > lastRevealedStep && currentStep <= totalSteps) {
          // Reveal segment at this step
          const offsetToReveal = selectedOffset >= 0 ? currentStep : -currentStep;
          setRevealedSegments(prev => new Set([...prev, offsetToReveal]));
          playRevealSound();
          lastRevealedStep = currentStep;
        }
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - ensure final rotation is exact
        wheelRotationRef.current = targetRotation;
        setWheelRotation(targetRotation);
        
        // Reveal all segments in path (safety)
        const finalRevealed = new Set<number>();
        for (let i = 0; i <= totalSteps; i++) {
          finalRevealed.add(selectedOffset >= 0 ? i : -i);
        }
        setRevealedSegments(finalRevealed);
        
        // Pointer bounce effect
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
        
        // Transition to result phase
        setTimeout(() => {
          setPhase('result');
          
          // Play appropriate sound based on final segment
          const { segment } = getFinalResult();
          if (segment.type === 'jackpot') {
            playJackpotSound();
          } else if (segment.type === 'bankrot') {
            playBankruptSound();
          } else if (segment.type === 'nic') {
            playNothingSound();
          } else {
            playVictoryFanfare();
          }
        }, 600);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const getFinalResult = () => {
    // After rotation animation, the target segment is now at offset 0 (under pointer)
    const currentRot = wheelRotationRef.current;
    
    // Find segment at offset 0 (directly under pointer after rotation)
    const targetSegment = shuffledSegments.find((_, index) => {
      const visualOffset = getVisualOffsetFromPointer(index, currentRot, shuffledSegments.length);
      return visualOffset === 0;
    });
    
    if (!targetSegment) {
      console.error('No segment found at offset 0');
      return { bonusPoints: 0, resultText: 'Chyba', segment: shuffledSegments[0] };
    }
    
    const segment = targetSegment;
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