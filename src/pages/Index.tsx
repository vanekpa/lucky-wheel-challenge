import { useState, useEffect } from 'react';
import { Wheel3D } from '@/components/game/Wheel3D';
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
      { id: 0, name: 'HRÁČ 1', score: 0, color: 'hsl(var(--wheel-red))' },
      { id: 1, name: 'HRÁČ 2', score: 0, color: 'hsl(var(--wheel-blue))' },
      { id: 2, name: 'HRÁČ 3', score: 0, color: 'hsl(var(--wheel-yellow))' },
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

  const handleTokenPlace = (segmentId: number) => {
    if (tokensPlaced.has(gameState.currentPlayer)) return;

    setTokenPositions((prev) => {
      const newMap = new Map(prev);
      newMap.set(segmentId, gameState.currentPlayer);
      return newMap;
    });

    setTokensPlaced((prev) => new Set(prev).add(gameState.currentPlayer));

    // Move to next player for token placement
    const nextPlayer = (gameState.currentPlayer + 1) % 3;
    if (tokensPlaced.size === 2) {
      // All tokens placed, enable spinning
      setIsPlacingTokens(false);
      setGameState((prev) => ({ ...prev, currentPlayer: 0 }));
    } else {
      setGameState((prev) => ({ ...prev, currentPlayer: nextPlayer }));
    }
  };

  const handleSpinComplete = (segment: WheelSegment) => {
    setGameState((prev) => ({ ...prev, isSpinning: false, wheelResult: segment }));

    // Check if landed on a token
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
    } else if (segment.type === 'nic') {
      toast.warning('NIČ! Tah přechází na dalšího hráče', {
        duration: 2000,
      });
      setGameState((prev) => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
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
    
    // Check if letter is in puzzle
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
    setGameState((prev) => ({ ...prev, isSpinning: true }));
    setShowLetterSelector(false);
    
    // Calculate final rotation
    const spins = 5 + Math.random() * 3;
    const finalSegmentIndex = Math.floor(Math.random() * 32);
    const segmentAngle = (Math.PI * 2) / 32;
    const finalRotation = wheelRotation + spins * Math.PI * 2 + finalSegmentIndex * segmentAngle;
    
    // Animate rotation
    const duration = 4000;
    const startTime = Date.now();
    const startRotation = wheelRotation;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + (finalRotation - startRotation) * eased;
      
      setWheelRotation(currentRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        handleSpinComplete(wheelSegments[finalSegmentIndex]);
      }
    };
    
    animate();
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
    }));
    setTokenPositions(new Map());
    setTokensPlaced(new Set());
    setIsPlacingTokens(true);
    setShowLetterSelector(false);
    toast.success('Nové kolo začíná! Umístěte žetony.');
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* Top Dock - Player Scores */}
      <PlayerScores players={gameState.players} currentPlayer={gameState.currentPlayer} />

      {/* Center Stage - 3D Wheel */}
      <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-48">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-7xl font-bold text-primary mb-2 tracking-wider drop-shadow-[0_0_30px_hsl(var(--primary)_/_0.5)]">
            KOLOTOČ
          </h1>
          <p className="text-2xl text-muted-foreground font-semibold">Kolo {gameState.round}</p>
        </div>

        {/* Wheel */}
        <Wheel3D
          rotation={wheelRotation}
          onSpinComplete={handleSpinComplete}
          isSpinning={gameState.isSpinning}
          tokenPositions={tokenPositions}
          onSegmentClick={handleTokenPlace}
          placingTokensMode={isPlacingTokens}
          players={gameState.players}
          currentPlayer={gameState.currentPlayer}
        />
        
        {/* Token placement instruction */}
        {isPlacingTokens && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-background/90 backdrop-blur-md px-8 py-4 rounded-lg border-2 border-primary shadow-2xl">
              <p className="text-2xl font-bold text-primary text-center">
                HRÁČ {gameState.currentPlayer + 1}: Umístěte žeton
              </p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Klikněte na segment kola
              </p>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        {!gameState.isSpinning && !showLetterSelector && !isPlacingTokens && (
          <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
            <Button
              onClick={handleSpin}
              variant="default"
              size="lg"
              className="text-2xl px-12 py-8 shadow-lg backdrop-blur-md bg-primary text-primary-foreground hover:scale-110 transition-transform"
            >
              ROZTOČIT
            </Button>
            <Button
              onClick={newRound}
              variant="secondary"
              size="lg"
              className="text-lg px-8 shadow-lg backdrop-blur-md bg-card/80"
            >
              NOVÉ KOLO
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Dock - Puzzle & Letters */}
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
