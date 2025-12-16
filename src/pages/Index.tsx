import { useState, useEffect, useRef } from 'react';
import { Wheel3D } from '@/components/game/Wheel3D';
import { WheelDetailView } from '@/components/game/WheelDetailView';
import { PlayerScores } from '@/components/game/PlayerScores';
import { BottomDock } from '@/components/game/BottomDock';
import { GameState, WheelSegment } from '@/types/game';
import { puzzles, wheelSegments } from '@/data/puzzles';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 0,
    players: [
      { id: 0, name: 'HRÁČ 1', score: 0, color: '#ff6b6b' },
      { id: 1, name: 'HRÁČ 2', score: 0, color: '#5b8def' },
      { id: 2, name: 'HRÁČ 3', score: 0, color: '#ffd700' },
    ],
    puzzle: {
      ...puzzles[0],
      revealedLetters: new Set(),
    },
    usedLetters: new Set(),
    round: 1,
    isSpinning: false,
  });

  const [showLetterSelector, setShowLetterSelector] = useState(false);
  const [currentWheelValue, setCurrentWheelValue] = useState<number>(0);
  const [isPlacingTokens, setIsPlacingTokens] = useState(true);
  const [tokenPositions, setTokenPositions] = useState<Map<number, number>>(new Map());
  const [tokensPlaced, setTokensPlaced] = useState<Set<number>>(new Set());
  const [wheelRotation, setWheelRotation] = useState(0);
  const wheelRotationRef = useRef(0);

  useEffect(() => {
    // Force re-render check when critical states change
  }, [gameState.isSpinning, showLetterSelector, isPlacingTokens, gameState.currentPlayer]);

  const handleTokenPlace = (segmentId: number) => {
    if (tokensPlaced.has(gameState.currentPlayer)) return;

    setTokenPositions((prev) => {
      const newMap = new Map(prev);
      newMap.set(segmentId, gameState.currentPlayer);
      return newMap;
    });

    setTokensPlaced((prev) => {
      const newSet = new Set(prev).add(gameState.currentPlayer);
      
      if (newSet.size === 3) {
        setIsPlacingTokens(false);
        setGameState((prevState) => ({ ...prevState, currentPlayer: 0 }));
      } else {
        const nextPlayer = (gameState.currentPlayer + 1) % 3;
        setGameState((prevState) => ({ ...prevState, currentPlayer: nextPlayer }));
      }
      
      return newSet;
    });
  };

  const handleSpinComplete = (segment: WheelSegment) => {
    console.log('🏁 Spin Completed. Landed on:', segment);
    
    setGameState((prev) => ({ ...prev, isSpinning: false, wheelResult: segment }));

    let tokenBonus = 0;
    let tokenOwner: number | undefined;
    tokenPositions.forEach((playerId, segmentId) => {
      if (wheelSegments[segmentId].id === segment.id) {
        tokenBonus = 2000;
        tokenOwner = playerId;
      }
    });

    if (tokenBonus > 0 && tokenOwner !== undefined) {
      toast.success(`Žeton hráče ${tokenOwner + 1}! Bonus +${tokenBonus} bodů!`, {
        duration: 3000,
      });
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === tokenOwner ? { ...p, score: p.score + tokenBonus } : p
        ),
      }));
    }

    if (segment.type === 'bankrot') {
      toast.error('BANKROT! Ztrácíte všechny body!', {
        duration: 3000,
      });
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === prev.currentPlayer ? { ...p, score: 0 } : p
        ),
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
      setShowLetterSelector(false);
      
    } else if (segment.type === 'nic') {
      toast.warning('NIČ! Tah přechází na dalšího hráče', {
        duration: 2000,
      });
      setGameState((prev) => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
      setShowLetterSelector(false);
      
    } else {
      setCurrentWheelValue(segment.value as number);
      setShowLetterSelector(true);
      toast.success(`Vytočili jste ${segment.value} bodů!`, {
        duration: 2000,
      });
    }
  };

  const handleLetterSelect = (letter: string) => {
    const upperLetter = letter.toUpperCase();
    
    const phrase = gameState.puzzle.phrase.toUpperCase();
    const count = (phrase.match(new RegExp(upperLetter, 'g')) || []).length;

    setGameState((prev) => ({
      ...prev,
      usedLetters: new Set([...prev.usedLetters, upperLetter]),
    }));

    if (count > 0) {
      const points = currentWheelValue * count;
      toast.success(`Správně! Odhalili jste ${count}× "${letter}" za ${points} bodů!`, {
        duration: 3000,
      });

      setGameState((prev) => ({
        ...prev,
        puzzle: {
          ...prev.puzzle,
          revealedLetters: new Set([...prev.puzzle.revealedLetters, upperLetter]),
        },
        players: prev.players.map((p) =>
          p.id === prev.currentPlayer ? { ...p, score: p.score + points } : p
        ),
      }));
    } else {
      toast.error(`Písmeno "${letter}" v tajence není. Tah přechází dál.`, {
        duration: 2000,
      });
      setGameState((prev) => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
    }

    setShowLetterSelector(false);
    setCurrentWheelValue(0);
  };

  const handleSpin = () => {
    if (gameState.isSpinning) return;

    console.log('🚀 Spinning started...');
    setGameState((prev) => ({ ...prev, isSpinning: true }));
    setShowLetterSelector(false);
    
    const extraSpins = 5;
    const targetSegmentIndex = Math.floor(Math.random() * 32);
    const segmentAngle = (Math.PI * 2) / 32;
    
    const currentRotation = wheelRotationRef.current;
    
    // Vypočítat přesnou cílovou rotaci PŘEDEM (střed segmentu)
    const segmentCenterAngle = targetSegmentIndex * segmentAngle + segmentAngle / 2;
    const pointerPos = 3 * Math.PI / 2; // Pointer na 270°
    const geometryOffset = -Math.PI / 2;
    const targetRotationInCircle = pointerPos - segmentCenterAngle - geometryOffset;
    
    // Normalizovat a přidat plné otočky
    const normalizedTarget = ((targetRotationInCircle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const fullRotations = Math.floor(currentRotation / (Math.PI * 2)) * (Math.PI * 2);
    const newRotation = fullRotations + (Math.PI * 2 * extraSpins) + normalizedTarget;
    
    const duration = 4000;
    const startTime = Date.now();
    const startRotation = currentRotation;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Plynulé zpomalení - easeOutQuint pro hladší zastavení
      const ease = 1 - Math.pow(1 - progress, 5);
      const currentRot = startRotation + (newRotation - startRotation) * ease;
      
      wheelRotationRef.current = currentRot;
      setWheelRotation(currentRot);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Přímo použít newRotation - žádný skok!
        wheelRotationRef.current = newRotation;
        setWheelRotation(newRotation);
        
        console.log('✅ Animation finished. Target segment:', targetSegmentIndex);
        setTimeout(() => {
          handleSpinComplete(wheelSegments[targetSegmentIndex]);
        }, 0);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const newRound = () => {
    const nextPuzzleIndex = gameState.round % puzzles.length;
    setGameState((prev) => ({
      ...prev,
      puzzle: {
        ...puzzles[nextPuzzleIndex],
        revealedLetters: new Set(),
      },
      usedLetters: new Set(),
      round: prev.round + 1,
      currentPlayer: 0,
      isSpinning: false
    }));
    setTokenPositions(new Map());
    setTokensPlaced(new Set());
    setIsPlacingTokens(true);
    setShowLetterSelector(false);
    toast.success('Nové kolo začíná! Umístěte žetony.');
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 text-foreground">
      {/* Camera Detail View */}
      <div className="absolute top-4 left-4 z-40 w-80 h-60 rounded-lg overflow-hidden border-4 border-primary/60 shadow-2xl backdrop-blur-sm bg-black/80 animate-fade-in">
        <div className="absolute top-2 left-2 z-10 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wide shadow-md">
          🎥 KAMERA
        </div>
        <WheelDetailView 
          rotation={wheelRotation} 
          rotationRef={wheelRotationRef}
          tokenPositions={tokenPositions}
          players={gameState.players}
        />
      </div>
      
      <PlayerScores players={gameState.players} currentPlayer={gameState.currentPlayer} />

      <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-48 min-h-0">
        <div className="text-center mb-4">
          <h1 className="text-5xl font-bold text-primary mb-1 tracking-wider drop-shadow-[0_0_30px_hsl(var(--primary)_/_0.5)]">
            KOLOTOČ
          </h1>
          <p className="text-xl text-muted-foreground font-semibold">Kolo {gameState.round}</p>
        </div>

        <div className="relative w-full max-w-3xl h-[500px] flex items-center justify-center">
          <Wheel3D
            rotation={wheelRotation}
            rotationRef={wheelRotationRef}
            isSpinning={gameState.isSpinning}
            onSpinComplete={() => {}}
            tokenPositions={tokenPositions}
            onSegmentClick={handleTokenPlace}
            placingTokensMode={isPlacingTokens}
            players={gameState.players}
            currentPlayer={gameState.currentPlayer}
          />
        </div>
        
        {isPlacingTokens && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
            <div className="bg-background/95 backdrop-blur-md px-8 py-6 rounded-xl border-4 border-primary shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center animate-in zoom-in duration-300">
              <p className="text-3xl font-bold text-primary mb-2">
                HRÁČ {gameState.currentPlayer + 1}
              </p>
              <p className="text-lg text-foreground font-medium">
                Umístěte svůj žeton na kolo
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                (Klikněte na libovolný barevný segment)
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        {!gameState.isSpinning && !showLetterSelector && !isPlacingTokens && (
          <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40 animate-in slide-in-from-right duration-500">
            <Button
              onClick={handleSpin}
              variant="default"
              size="lg"
              className="text-2xl px-12 py-8 shadow-lg backdrop-blur-md bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90 transition-all duration-200 border-4 border-white/10"
            >
              ROZTOČIT
            </Button>
            <Button
              onClick={newRound}
              variant="secondary"
              size="lg"
              className="text-lg px-8 shadow-lg backdrop-blur-md bg-card/80 hover:bg-card"
            >
              NOVÉ KOLO
            </Button>
          </div>
        )}
      </div>

      <BottomDock
        puzzle={gameState.puzzle}
        usedLetters={gameState.usedLetters}
        showLetterSelector={showLetterSelector}
        onLetterSelect={handleLetterSelect}
        disabled={gameState.isSpinning}
      />
    </div>
  );
};

export default Index;
