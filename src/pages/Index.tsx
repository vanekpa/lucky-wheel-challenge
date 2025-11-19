import { useState, useEffect } from 'react';
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
      { id: 0, name: 'HRÁČ 1', score: 0, color: '#ff6b6b' }, // Červená
      { id: 1, name: 'HRÁČ 2', score: 0, color: '#5b8def' }, // Modrá
      { id: 2, name: 'HRÁČ 3', score: 0, color: '#ffd700' }, // Žlutá
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
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    segmentIndex: -1,
    segmentId: -1,
    value: '',
    color: '',
    rotation: 0,
    pointerAngle: 0,
  });

  const handleTokenPlace = (segmentId: number) => {
    if (tokensPlaced.has(gameState.currentPlayer)) return;

    setTokenPositions((prev) => {
      const newMap = new Map(prev);
      newMap.set(segmentId, gameState.currentPlayer);
      return newMap;
    });

    setTokensPlaced((prev) => {
      const newSet = new Set(prev).add(gameState.currentPlayer);
      
      console.log(`🎯 Token placed by Player ${gameState.currentPlayer + 1}, Total tokens: ${newSet.size}`);
      
      // Check with UPDATED state
      if (newSet.size === 3) {
        // All 3 tokens placed, enable spinning
        console.log('✅ All tokens placed! Enabling spin button');
        setIsPlacingTokens(false);
        setGameState((prevState) => ({ ...prevState, currentPlayer: 0 }));
      } else {
        // Next player's turn
        const nextPlayer = (gameState.currentPlayer + 1) % 3;
        console.log(`➡️ Next player: ${nextPlayer + 1}`);
        setGameState((prevState) => ({ ...prevState, currentPlayer: nextPlayer }));
      }
      
      return newSet;
    });
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
    
    // Clockwise rotace: segment s angle A bude po rotaci R na pozici (A + R)
    // Chceme: A + R = π (pointer angle)
    // Tedy: R = π - A
    const segmentCenterAngle = finalSegmentIndex * segmentAngle + segmentAngle / 2;
    const targetRotation = Math.PI - segmentCenterAngle;
    
    // Normalize to 0-2π and ensure positive
    const normalizedTarget = ((targetRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // Add full spins
    const finalRotation = wheelRotation + spins * Math.PI * 2 + normalizedTarget;
    
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
      
      // Update debug info during animation
      const normalizedRotation = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const pointerAngle = Math.PI * 3 / 2;
      const segmentAngle = (Math.PI * 2) / 32;
      // Account for the -90° offset in Wheel3D segment rendering
      const targetAngle = (pointerAngle - normalizedRotation + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      const detectedSegmentIndex = Math.floor(targetAngle / segmentAngle) % 32;
      const currentSegment = wheelSegments[detectedSegmentIndex];
      
      setDebugInfo({
        segmentIndex: detectedSegmentIndex,
        segmentId: currentSegment.id,
        value: String(currentSegment.value),
        color: currentSegment.color,
        rotation: normalizedRotation * 180 / Math.PI,
        pointerAngle: pointerAngle * 180 / Math.PI,
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        handleSpinComplete(currentSegment);
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
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 text-foreground">
      {/* Camera Detail View - Levý horní roh */}
      <div className="absolute top-4 left-4 z-40 w-80 h-60 rounded-lg overflow-hidden border-4 border-primary/60 shadow-2xl backdrop-blur-sm bg-black/20 animate-fade-in">
        <div className="absolute top-2 left-2 z-10 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wide">
          🎥 LIVE
        </div>
        <WheelDetailView rotation={wheelRotation} />
      </div>

      {/* Debug Panel */}
      <div className="absolute top-2 left-[22rem] bg-black/80 text-white p-4 rounded-lg z-50 font-mono text-sm space-y-1 border border-yellow-500/50">
        <div className="text-yellow-400 font-bold mb-2">🔧 DEBUG INFO</div>
        <div>Segment Index: <span className="text-green-400">{debugInfo.segmentIndex}</span></div>
        <div>Segment ID: <span className="text-green-400">{debugInfo.segmentId}</span></div>
        <div>Value: <span className="text-cyan-400 font-bold">{debugInfo.value}</span></div>
        <div>Color: <span className="text-pink-400">{debugInfo.color}</span></div>
        <div className="flex items-center gap-2">
          Preview: <div className="w-6 h-6 rounded border border-white" style={{ backgroundColor: debugInfo.color }}></div>
        </div>
        <div className="pt-2 border-t border-gray-600">
          <div>Rotation: <span className="text-purple-400">{debugInfo.rotation.toFixed(1)}°</span></div>
          <div>Pointer: <span className="text-purple-400">{debugInfo.pointerAngle.toFixed(1)}°</span></div>
        </div>
      </div>
      
      {/* Top Dock - Player Scores */}
      <PlayerScores players={gameState.players} currentPlayer={gameState.currentPlayer} />

      {/* Center Stage - 3D Wheel */}
      <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-48 min-h-0">
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-5xl font-bold text-primary mb-1 tracking-wider drop-shadow-[0_0_30px_hsl(var(--primary)_/_0.5)]">
            KOLOTOČ
          </h1>
          <p className="text-xl text-muted-foreground font-semibold">Kolo {gameState.round}</p>
        </div>

        {/* Wheel Container with fixed dimensions */}
        <div className="relative w-full max-w-3xl h-[500px] flex items-center justify-center">
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
        </div>
        
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
