import { useState, useEffect, useRef } from 'react';
import { Wheel3D } from '@/components/game/Wheel3D';
import { WheelDetailView } from '@/components/game/WheelDetailView';
import { PlayerScores } from '@/components/game/PlayerScores';
import { BottomDock } from '@/components/game/BottomDock';
import { TextDebugPanel } from '@/components/game/TextDebugPanel';
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
  const wheelRotationRef = useRef(0);
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    segmentIndex: -1,
    segmentId: -1,
    value: '',
    color: '',
    rotation: 0,
    pointerAngle: 0,
  });

  // Debug rotation values
  const [debugRotation, setDebugRotation] = useState({
    x: -90,
    y: -90,
    z: 0,
    yOffset: 0.01
  });

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
    
    // 1. Reset spinning state immediately
    setGameState((prev) => ({ ...prev, isSpinning: false, wheelResult: segment }));

    // 2. Check token bonus
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

    // 3. Handle segment types
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
      // Points logic
      setCurrentWheelValue(segment.value as number);
      setShowLetterSelector(true); // This enables the UI for letter selection
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
    if (gameState.isSpinning) return;

    console.log('🚀 Spinning started...');
    setGameState((prev) => ({ ...prev, isSpinning: true }));
    setShowLetterSelector(false);
    
    // Random spin setup
    const extraSpins = 5;
    const targetSegmentIndex = Math.floor(Math.random() * 32);
    const segmentAngle = (Math.PI * 2) / 32;
    
    // Calculate rotation to land exactly on center of target segment
    // Pointer is at -Z (270 deg or 3PI/2)
    // Segment 0 is at -PI/2
    // We need to account for these offsets
    const currentRotation = wheelRotationRef.current;
    
    // Calculate target rotation
    // Current visual offset is -PI/2 (from Wheel3D geometry)
    // We want targetSegment to end up at Pointer (3PI/2)
    const targetAngle = targetSegmentIndex * segmentAngle;
    const offset = Math.PI / 2; // Geometry offset
    
    // How much more we need to rotate to align target with pointer
    // This math ensures we land on the correct segment ID
    const rotationNeeded = (2 * Math.PI) - targetAngle + (3 * Math.PI / 2) - offset;
    
    // Add multiple full spins and current rotation base
    const newRotation = currentRotation + (Math.PI * 2 * extraSpins) + (rotationNeeded % (Math.PI * 2));
    
    // Animate
    const duration = 4000;
    const startTime = Date.now();
    const startRotation = currentRotation;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRotation + (newRotation - startRotation) * ease;
      
      wheelRotationRef.current = currentRot;
      setWheelRotation(currentRot);
      
      // Calculate debug info live
      const normalizedRot = currentRot % (Math.PI * 2);
      // Reverse engineer the segment index from rotation
      // This formula must match the visual representation in Wheel3D
      const visualOffset = -Math.PI / 2;
      const pointerAngle = 3 * Math.PI / 2;
      
      // Calculate which segment is currently at the pointer
      // angle + rotation = pointer
      let angleAtPointer = (pointerAngle - visualOffset - normalizedRot) % (Math.PI * 2);
      if (angleAtPointer < 0) angleAtPointer += Math.PI * 2;
      
      const detectedIndex = Math.floor(angleAtPointer / segmentAngle) % 32;
      const currentSegment = wheelSegments[detectedIndex] || wheelSegments[0];

      setDebugInfo({
        segmentIndex: detectedIndex,
        segmentId: currentSegment.id,
        value: String(currentSegment.value),
        color: currentSegment.color,
        rotation: (normalizedRot * 180 / Math.PI),
        pointerAngle: 270
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - SNAP to exact segment center
        const finalSegment = wheelSegments[targetSegmentIndex];
        
        // Calculate exact rotation for perfect center alignment
        const segmentCenterAngle = targetSegmentIndex * segmentAngle + segmentAngle / 2;
        const pointerPos = 3 * Math.PI / 2; // 270°
        const geometryOffset = -Math.PI / 2;
        const snappedRotation = pointerPos - segmentCenterAngle - geometryOffset;
        
        // Keep full rotations, just snap the final position
        const fullRotations = Math.floor(currentRot / (Math.PI * 2)) * (Math.PI * 2);
        const finalRotation = fullRotations + ((snappedRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        
        wheelRotationRef.current = finalRotation;
        setWheelRotation(finalRotation);
        
        console.log('✅ Animation finished. Target:', targetSegmentIndex, 'Snapped to center');
        handleSpinComplete(finalSegment);
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
      isSpinning: false // Ensure spinning is reset
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
          debugRotation={debugRotation}
        />
      </div>

      {/* Debug Panel (Optional - can be hidden) */}
      <div className="absolute top-2 left-[22rem] bg-black/80 text-white p-4 rounded-lg z-50 font-mono text-xs space-y-1 border border-yellow-500/50 hidden xl:block">
        <div className="text-yellow-400 font-bold mb-2">🔧 SYSTEM INFO</div>
        <div>Segment: <span className="text-green-400">{debugInfo.segmentIndex}</span></div>
        <div>Value: <span className="text-cyan-400 font-bold">{debugInfo.value}</span></div>
        <div>State: <span className={gameState.isSpinning ? "text-red-400" : "text-green-400"}>
          {gameState.isSpinning ? 'SPINNING' : 'IDLE'}
        </span></div>
        <div>Selector: <span className={showLetterSelector ? "text-green-400" : "text-gray-400"}>
          {showLetterSelector ? 'VISIBLE' : 'HIDDEN'}
        </span></div>
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
            onSpinComplete={() => {}} // Handled by parent animation loop
            tokenPositions={tokenPositions}
            onSegmentClick={handleTokenPlace}
            placingTokensMode={isPlacingTokens}
            players={gameState.players}
            currentPlayer={gameState.currentPlayer}
            debugRotation={debugRotation}
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

      {/* Debug Panel */}
      <TextDebugPanel
        rotationX={debugRotation.x}
        rotationY={debugRotation.y}
        rotationZ={debugRotation.z}
        yOffset={debugRotation.yOffset}
        onRotationXChange={(x) => setDebugRotation({ ...debugRotation, x })}
        onRotationYChange={(y) => setDebugRotation({ ...debugRotation, y })}
        onRotationZChange={(z) => setDebugRotation({ ...debugRotation, z })}
        onYOffsetChange={(yOffset) => setDebugRotation({ ...debugRotation, yOffset })}
      />
    </div>
  );
};

export default Index;
