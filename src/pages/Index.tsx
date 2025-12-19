import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Wheel3D } from "@/components/game/Wheel3D";
import { WheelDetailView } from "@/components/game/WheelDetailView";
import { PlayerScores } from "@/components/game/PlayerScores";
import { BottomDock } from "@/components/game/BottomDock";
import { PlayerSetup } from "@/components/game/PlayerSetup";
import { GameModeSelect } from "@/components/game/GameModeSelect";
import { TeacherPuzzleInput } from "@/components/game/TeacherPuzzleInput";
import { DeviceHandover } from "@/components/game/DeviceHandover";
import { GuessPhraseDialog } from "@/components/game/GuessPhraseDialog";
import { PlayerSettings } from "@/components/game/PlayerSettings";
import { TurnTimer } from "@/components/game/TurnTimer";
import { SpinButton } from "@/components/game/SpinButton";
import BonusWheel from "@/components/game/BonusWheel";
import VictoryScreen from "@/components/game/VictoryScreen";
import EndGameDialog from "@/components/game/EndGameDialog";
import { GameState, WheelSegment, Player } from "@/types/game";
import { wheelSegments } from "@/data/puzzles";
import { usePuzzles } from "@/hooks/usePuzzles";
import { getLetterVariants, VOWELS, MIN_SCORE_FOR_VOWELS } from "@/components/game/LetterSelector";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StudioEffects } from "@/components/game/StudioEffects";
import { SeasonalEffects } from "@/components/game/SeasonalEffects";
import { useSeason } from "@/hooks/useSeason";
import { useSounds, setSoundsEnabledGlobal } from "@/hooks/useSounds";
import { useTurnTimer } from "@/hooks/useTurnTimer";
import { useGameSession, type GameCommand } from "@/hooks/useGameSession";
import { playTickSound, playWinSound, playBankruptSound, playNothingSound, playBuzzerSound, play100PointsSound, play1000PointsSound, play2000PointsSound } from "@/utils/sounds";

type GamePhase = "intro" | "teacher-input" | "handover" | "setup" | "playing" | "bonus-wheel" | "victory";

interface CustomPuzzle {
  phrase: string;
  category: string;
}

const Index = () => {
  const { sessionCode } = useParams<{ sessionCode?: string }>();
  const { puzzles, loading, getRandomPuzzle, getRandomPuzzles } = usePuzzles();
  const { colors } = useSeason();
  const { soundsEnabled } = useSounds();
  const { turnTimer } = useTurnTimer();
  
  // Session management for remote control
  const { session, isHost, updateGameState, createSession, endSession } = useGameSession(sessionCode);
  const lastCommandTimestamp = useRef<number>(0);
  const [localSessionCode, setLocalSessionCode] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Handle session code from URL or local creation
  const activeSessionCode = sessionCode || localSessionCode;

  
  const [gamePhase, setGamePhase] = useState<GamePhase>("intro");
  const [gameMode, setGameMode] = useState<"random" | "teacher">("random");
  const [customPuzzles, setCustomPuzzles] = useState<CustomPuzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerResetKey, setTimerResetKey] = useState(0);

  // Sync sounds enabled state globally
  useEffect(() => {
    setSoundsEnabledGlobal(soundsEnabled);
  }, [soundsEnabled]);

  // Cleanup session on browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeSessionCode) {
        // Use sendBeacon for reliable delivery during page unload
        const url = `https://konrlmeglqbbybyvwiuc.supabase.co/functions/v1/cleanup-sessions`;
        navigator.sendBeacon(url, JSON.stringify({ session_code: activeSessionCode }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSessionCode]);

  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 0,
    players: [
      { id: 0, name: "HRÁČ 1", score: 0, color: "#ff6b6b" },
      { id: 1, name: "HRÁČ 2", score: 0, color: "#5b8def" },
      { id: 2, name: "HRÁČ 3", score: 0, color: "#ffd700" },
    ],
    puzzle: {
      id: "1",
      phrase: "NAČÍTÁNÍ...",
      category: "",
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
  const [pointerBounce, setPointerBounce] = useState(0);
  const [currentDisplaySegment, setCurrentDisplaySegment] = useState<WheelSegment | null>(null);

  // Result display state
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultType, setResultType] = useState<"success" | "error">("success");

  // Pending command result - used to sync command feedback after state updates
  const [pendingCommandResult, setPendingCommandResult] = useState<{
    type: 'success' | 'error';
    message: string;
    clearCommand: boolean;
  } | null>(null);

  // Effects toggle state
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [showGuessDialog, setShowGuessDialog] = useState(false);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [vowelsForceUnlocked, setVowelsForceUnlocked] = useState(false);

  // Create session with current game state for remote control
  const handleCreateSession = useCallback(async () => {
    setIsCreatingSession(true);
    try {
      // Build current game state for session initialization
      const initialState = {
        currentPlayer: gameState.currentPlayer,
        players: gameState.players,
        puzzle: gameState.puzzle ? {
          ...gameState.puzzle,
          revealedLetters: Array.from(gameState.puzzle.revealedLetters)
        } : null,
        usedLetters: Array.from(gameState.usedLetters),
        round: gameState.round,
        isSpinning: gameState.isSpinning,
        showLetterSelector,
        isPlacingTokens,
        tokenPositions: Object.fromEntries(tokenPositions),
        tokensPlaced: Array.from(tokensPlaced),
        gameMode,
        vowelsForceUnlocked,
        isGuessingPhrase: showGuessDialog,
        _hostHeartbeat: Date.now()
      };
      
      const code = await createSession(initialState);
      if (code) {
        setLocalSessionCode(code);
        // Update URL without page reload
        window.history.replaceState(null, '', `/play/${code}`);
      }
      return code;
    } finally {
      setIsCreatingSession(false);
    }
  }, [createSession, gameState, showLetterSelector, isPlacingTokens, tokenPositions, tokensPlaced, gameMode, vowelsForceUnlocked, showGuessDialog]);

  const [gameHistory, setGameHistory] = useState<
    Array<{
      gameState: GameState;
      showLetterSelector: boolean;
      currentWheelValue: number;
    }>
  >([]);

  // Stop timer when guess dialog opens
  useEffect(() => {
    if (showGuessDialog) {
      setTimerActive(false);
    }
  }, [showGuessDialog]);

  // Heartbeat tick - triggers sync effect every 5 seconds to keep controllers updated
  const [heartbeatTick, setHeartbeatTick] = useState(0);
  
  useEffect(() => {
    if (!activeSessionCode || !session) return;
    const interval = setInterval(() => {
      setHeartbeatTick(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSessionCode, session?.id]);

  // Process commands from remote controllers - using a ref to track processed commands
  const processedCommandsRef = useRef<Map<number, number>>(new Map()); // timestamp -> added time
  // Ref to capture pendingCommandResult for sync without causing infinite loop
  const pendingCommandResultRef = useRef(pendingCommandResult);
  pendingCommandResultRef.current = pendingCommandResult;

  // Sync game state to session when playing with remote controllers
  useEffect(() => {
    if (!activeSessionCode || !session) return;
    
    // Get existing pending command from session to preserve it during sync
    const existingPendingCommand = session.game_state?._pendingCommand;
    const existingCommandTimestamp = session.game_state?._commandTimestamp;
    
    // Check if we have a pending command result to send (using ref to avoid dependency)
    const currentPendingResult = pendingCommandResultRef.current;
    const shouldClearCommand = currentPendingResult?.clearCommand;
    
    // Convert Sets to Arrays for JSON serialization
    const serializableState = {
      currentPlayer: gameState.currentPlayer,
      players: gameState.players,
      puzzle: gameState.puzzle ? {
        ...gameState.puzzle,
        revealedLetters: Array.from(gameState.puzzle.revealedLetters)
      } : null,
      usedLetters: Array.from(gameState.usedLetters),
      round: gameState.round,
      isSpinning: gameState.isSpinning,
      showLetterSelector,
      isPlacingTokens,
      tokenPositions: Object.fromEntries(tokenPositions),
      tokensPlaced: Array.from(tokensPlaced),
      gameMode,
      vowelsForceUnlocked,
      isGuessingPhrase: showGuessDialog,
      _hostHeartbeat: Date.now(),
      // If we processed a command, clear it and send result; otherwise preserve pending
      ...(shouldClearCommand ? {
        _pendingCommand: null,
        _commandTimestamp: null,
        _lastCommandResult: {
          type: currentPendingResult.type,
          message: currentPendingResult.message,
          timestamp: Date.now()
        }
      } : (existingPendingCommand && existingCommandTimestamp && !processedCommandsRef.current.has(existingCommandTimestamp) ? {
        _pendingCommand: existingPendingCommand,
        _commandTimestamp: existingCommandTimestamp
      } : {}))
    };
    
    updateGameState(serializableState);
    
    // Clear pending command result after sending (using setTimeout to avoid state update during render)
    if (currentPendingResult) {
      setTimeout(() => setPendingCommandResult(null), 0);
    }
    
    // Clean up old processed commands (older than 60 seconds) to prevent memory leak
    const now = Date.now();
    for (const [cmdTimestamp, addedTime] of processedCommandsRef.current.entries()) {
      if (now - addedTime > 60000) {
        processedCommandsRef.current.delete(cmdTimestamp);
      }
    }
  }, [gameState, showLetterSelector, isPlacingTokens, tokenPositions, tokensPlaced, activeSessionCode, gameMode, showGuessDialog, vowelsForceUnlocked, heartbeatTick]);
  

  // Save current state to history before making changes
  const saveStateToHistory = useCallback(() => {
    setGameHistory((prev) => {
      const newHistory = [
        ...prev,
        {
          gameState: {
            ...gameState,
            puzzle: {
              ...gameState.puzzle,
              revealedLetters: new Set(gameState.puzzle.revealedLetters),
            },
            usedLetters: new Set(gameState.usedLetters),
            players: gameState.players.map((p) => ({ ...p })),
          },
          showLetterSelector,
          currentWheelValue,
        },
      ];
      // Keep only last 10 states
      return newHistory.slice(-10);
    });
  }, [gameState, showLetterSelector, currentWheelValue]);

  // Undo to previous state
  const handleUndo = useCallback(() => {
    if (gameHistory.length === 0) return;

    const lastState = gameHistory[gameHistory.length - 1];
    setGameState({
      ...lastState.gameState,
      puzzle: {
        ...lastState.gameState.puzzle,
        revealedLetters: new Set(lastState.gameState.puzzle.revealedLetters),
      },
      usedLetters: new Set(lastState.gameState.usedLetters),
    });
    setShowLetterSelector(lastState.showLetterSelector);
    setCurrentWheelValue(lastState.currentWheelValue);
    setShowResult(false);
    setGameHistory((prev) => prev.slice(0, -1));
  }, [gameHistory]);

  // Switch to specific player
  const handleSwitchPlayer = useCallback((playerId: number) => {
    saveStateToHistory();
    setGameState((prev) => ({ ...prev, currentPlayer: playerId }));
    setShowLetterSelector(false);
    setShowResult(false);
  }, [saveStateToHistory]);

  // Mode selection handlers
  const handleSelectRandom = () => {
    setGameMode("random");
    setGamePhase("setup");
  };

  const handleSelectTeacher = () => {
    setGameMode("teacher");
    setGamePhase("handover"); // Show handover BEFORE puzzle input
  };

  const handleHandoverContinue = () => {
    setGamePhase("teacher-input"); // Then go to puzzle input
  };

  const handleTeacherPuzzlesComplete = (puzzles: CustomPuzzle[]) => {
    setCustomPuzzles(puzzles);
    setCurrentPuzzleIndex(0);
    setGamePhase("setup"); // Go directly to player setup
  };

  const getNextPuzzle = () => {
    if (gameMode === "teacher" && customPuzzles.length > 0) {
      const puzzle = customPuzzles[currentPuzzleIndex % customPuzzles.length];
      return {
        id: `custom-${currentPuzzleIndex}`,
        phrase: puzzle.phrase,
        category: puzzle.category,
      };
    }
    return getRandomPuzzle();
  };

  const handleSetupComplete = (players: Player[]) => {
    const puzzle = getNextPuzzle();
    setGameState((prev) => ({
      ...prev,
      players,
      puzzle: {
        ...puzzle,
        revealedLetters: new Set(),
      },
    }));
    setGamePhase("playing");
    toast.success("Hra začíná! Umístěte žetony na kolo.");
  };

  const handleTokenPlace = useCallback((segmentId: number) => {
    if (tokensPlaced.has(gameState.currentPlayer)) return;

    // Find a free segment - if clicked segment is occupied, find nearest free one
    const findFreeSegment = (startId: number): number => {
      const occupiedSegments = new Set(tokenPositions.keys());
      if (!occupiedSegments.has(startId)) return startId;
      
      // Search outward from clicked segment
      for (let offset = 1; offset <= 16; offset++) {
        const nextId = (startId + offset) % 32;
        if (!occupiedSegments.has(nextId)) return nextId;
        const prevId = (startId - offset + 32) % 32;
        if (!occupiedSegments.has(prevId)) return prevId;
      }
      return startId; // Fallback (shouldn't happen with 32 segments and max 9 tokens)
    };

    const finalSegmentId = findFreeSegment(segmentId);
    const currentPlayerId = gameState.currentPlayer;

    // 1. Update token positions
    setTokenPositions((prev) => {
      const newMap = new Map(prev);
      newMap.set(finalSegmentId, currentPlayerId);
      return newMap;
    });

    // 2. Calculate new state outside of setters
    const newTokensPlaced = new Set(tokensPlaced).add(currentPlayerId);
    const allPlaced = newTokensPlaced.size === 3;

    // 3. Update tokensPlaced
    setTokensPlaced(newTokensPlaced);

    // 4. Update isPlacingTokens and currentPlayer separately (not nested)
    if (allPlaced) {
      setIsPlacingTokens(false);
      setGameState((prev) => ({ ...prev, currentPlayer: 0 }));
    } else {
      const nextPlayer = (currentPlayerId + 1) % 3;
      setGameState((prev) => ({ ...prev, currentPlayer: nextPlayer }));
    }
  }, [gameState.currentPlayer, tokensPlaced, tokenPositions]);

  const animatePointerBounce = () => {
    const startTime = Date.now();
    const duration = 600;

    const bounce = () => {
      const progress = (Date.now() - startTime) / duration;
      if (progress < 1) {
        setPointerBounce(progress);
        requestAnimationFrame(bounce);
      } else {
        setPointerBounce(0);
      }
    };
    requestAnimationFrame(bounce);
  };

  const handleSpinComplete = (segment: WheelSegment) => {
    console.log("🏁 Spin Completed. Landed on:", segment);

    animatePointerBounce();

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
        players: prev.players.map((p) => (p.id === tokenOwner ? { ...p, score: p.score + tokenBonus } : p)),
      }));
    }

    if (segment.type === "bankrot") {
      playBankruptSound();
      toast.error("BANKROT! Ztrácíte všechny body!", {
        duration: 3000,
      });
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === prev.currentPlayer ? { ...p, score: 0 } : p)),
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
      setShowLetterSelector(false);
    } else if (segment.type === "nic") {
      playNothingSound();
      toast.warning("NIC! Tah přechází na dalšího hráče", {
        duration: 2000,
      });
      setGameState((prev) => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
      setShowLetterSelector(false);
    } else {
      // Special voice lines for specific point values
      if (segment.value === 100) {
        play100PointsSound();
      } else if (segment.value === 1000) {
        play1000PointsSound();
      } else if (segment.value === 2000) {
        play2000PointsSound();
      } else {
        playWinSound();
      }
      setCurrentWheelValue(segment.value as number);
      setShowLetterSelector(true);
      // Activate timer when points are won
      if (turnTimer > 0) {
        setTimerResetKey(prev => prev + 1);
        setTimerActive(true);
      }
      toast.success(`Vytočili jste ${segment.value} bodů!`, {
        duration: 2000,
      });
    }
  };

  const handleLetterSelect = useCallback((letter: string) => {
    saveStateToHistory();
    
    // Stop timer when letter is selected
    setTimerActive(false);

    const upperLetter = letter.toUpperCase();
    const variants = getLetterVariants(upperLetter);
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const currentScore = currentPlayer.score;
    // Team unlock: if ANY player has unlocked vowels this round, all can use them
    const isVowelsUnlocked = gameState.players.some(p => p.vowelsUnlockedThisRound);

    // Check if vowel and not unlocked yet (unless force unlocked due to deadlock)
    if (VOWELS.has(upperLetter) && currentScore < MIN_SCORE_FOR_VOWELS && !isVowelsUnlocked && !vowelsForceUnlocked) {
      playNothingSound();
      setResultMessage(`Samohlásky můžete hádat až od ${MIN_SCORE_FOR_VOWELS} bodů! Ztráta tahu.`);
      setResultType("error");
      setShowResult(true);
      setShowLetterSelector(false);

      setGameState((prev) => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
      return;
    }

    // Check if letter was already used - penalty!
    const alreadyUsed = variants.some((v) => gameState.usedLetters.has(v));
    if (alreadyUsed) {
      playNothingSound();
      setResultMessage(`Písmeno "${letter}" už bylo řečeno! Ztráta tahu.`);
      setResultType("error");
      setShowResult(true);
      setShowLetterSelector(false);

      setGameState((prev) => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
      return;
    }

    const phrase = gameState.puzzle.phrase.toUpperCase();

    // Count all variants in the phrase
    let totalCount = 0;
    variants.forEach((variant) => {
      totalCount += (phrase.match(new RegExp(variant, "g")) || []).length;
    });

    // Mark all variants as used
    setGameState((prev) => ({
      ...prev,
      usedLetters: new Set([...prev.usedLetters, ...variants]),
    }));

    if (totalCount > 0) {
      const points = currentWheelValue * totalCount;
      const variantsFound = variants.filter((v) => phrase.includes(v)).join(", ");

      // Show result with delay
      setResultMessage(`Správně! ${totalCount}× "${variantsFound}" = +${points} bodů`);
      setResultType("success");
      setShowResult(true);
      setShowLetterSelector(false);

      setGameState((prev) => {
        const newScore = prev.players[prev.currentPlayer].score + points;
        const shouldUnlockVowels = newScore >= MIN_SCORE_FOR_VOWELS;
        
        return {
          ...prev,
          puzzle: {
            ...prev.puzzle,
            revealedLetters: new Set([...prev.puzzle.revealedLetters, ...variants]),
          },
          players: prev.players.map((p) => 
            p.id === prev.currentPlayer 
              ? { ...p, score: newScore, vowelsUnlockedThisRound: shouldUnlockVowels || p.vowelsUnlockedThisRound } 
              : p
          ),
        };
      });
    } else {
      // Show error result with delay
      setResultMessage(`Písmeno "${letter}" v tajence není. Tah přechází dál.`);
      setResultType("error");
      setShowResult(true);
      setShowLetterSelector(false);

      setGameState((prev) => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
    }
  }, [gameState.players, gameState.currentPlayer, gameState.usedLetters, gameState.puzzle.phrase, currentWheelValue, vowelsForceUnlocked, saveStateToHistory]);

  const handleResultDismiss = () => {
    setShowResult(false);
    setResultMessage("");
    setCurrentWheelValue(0);
  };

  // Handle timer expiration
  const handleTimeUp = useCallback(() => {
    setTimerActive(false);
    playBuzzerSound();
    toast.error("⏰ Čas vypršel! Ztráta tahu.", { duration: 2000 });
    setShowLetterSelector(false);
    setGameState((prev) => ({
      ...prev,
      currentPlayer: (prev.currentPlayer + 1) % 3,
    }));
  }, []);

  // Check for deadlock: all consonants tried but no one has enough points for vowels
  const checkForDeadlock = useCallback(() => {
    if (vowelsForceUnlocked || gamePhase !== "playing") return;
    
    const phrase = gameState.puzzle.phrase.toUpperCase();
    const consonantsInPhrase = [...phrase].filter(c => 
      /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(c) && !VOWELS.has(c)
    );
    
    // All consonants either revealed or already tried?
    const allConsonantsHandled = consonantsInPhrase.every(c => 
      gameState.puzzle.revealedLetters.has(c) || 
      gameState.usedLetters.has(c)
    );
    
    // No one has enough points for vowels?
    const maxScore = Math.max(...gameState.players.map(p => p.score));
    const anyoneHasVowelsUnlocked = gameState.players.some(p => p.vowelsUnlockedThisRound);
    
    if (allConsonantsHandled && maxScore < MIN_SCORE_FOR_VOWELS && !anyoneHasVowelsUnlocked) {
      setVowelsForceUnlocked(true);
      toast.info("🔓 Samohlásky odemčeny - všechny souhlásky jsou vyřešeny!", { duration: 4000 });
    }
  }, [gameState, vowelsForceUnlocked, gamePhase]);

  // Run deadlock check after game state changes
  useEffect(() => {
    checkForDeadlock();
  }, [gameState.usedLetters, gameState.puzzle.revealedLetters, checkForDeadlock]);

  const newRound = useCallback(() => {
    const nextIndex = currentPuzzleIndex + 1;
    setCurrentPuzzleIndex(nextIndex);

    let puzzle;
    if (gameMode === "teacher" && customPuzzles.length > 0) {
      if (nextIndex >= customPuzzles.length) {
        // Game finished - go to bonus wheel for the winner
        const winner = [...gameState.players].sort((a, b) => b.score - a.score)[0];
        toast.success(`Všechny tajenky odehrány! ${winner.name} jde do BONUS KOLA!`);
        setGamePhase("bonus-wheel");
        return;
      }
      puzzle = {
        id: `custom-${nextIndex}`,
        phrase: customPuzzles[nextIndex].phrase,
        category: customPuzzles[nextIndex].category,
      };
    } else {
      puzzle = getRandomPuzzle();
    }

    const nextRoundNum = gameState.round + 1;

    // Tokens persist! Only reset tokensPlaced for rounds 1-3 (each player adds 1 token per round)
    // Round 4+ = no new tokens
    const shouldPlaceTokens = nextRoundNum <= 3;

    setGameState((prev) => ({
      ...prev,
      puzzle: {
        ...puzzle,
        revealedLetters: new Set(),
      },
      usedLetters: new Set(),
      round: nextRoundNum,
      currentPlayer: 0,
      isSpinning: false,
      // Reset vowelsUnlockedThisRound for all players at new round
      players: prev.players.map((p) => ({ ...p, vowelsUnlockedThisRound: false })),
    }));

    // Reset force-unlocked vowels for new round
    setVowelsForceUnlocked(false);

    // Don't clear tokenPositions - tokens stay on the wheel!
    // Only reset which players have placed THIS round's token
    setTokensPlaced(new Set());
    setIsPlacingTokens(shouldPlaceTokens);
    setShowLetterSelector(false);

    if (shouldPlaceTokens) {
      toast.success(`Kolo ${nextRoundNum}/${gameMode === "teacher" ? customPuzzles.length : "∞"} - Umístěte další žeton!`);
    } else {
      toast.success(`Kolo ${nextRoundNum}/${gameMode === "teacher" ? customPuzzles.length : "∞"} začíná!`);
    }
  }, [currentPuzzleIndex, gameMode, customPuzzles, gameState.players, gameState.round, getRandomPuzzle]);

  const handleGuessPhrase = useCallback((guess: string) => {
    saveStateToHistory();

    const correctPhrase = gameState.puzzle.phrase.toUpperCase().trim();
    const playerGuess = guess.toUpperCase().trim();

    if (playerGuess === correctPhrase) {
      // Calculate bonus: 1000 points per unique unrevealed letter
      const allLetters = correctPhrase.split("").filter((char) => /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(char));
      const uniqueUnrevealedLetters = new Set(
        allLetters.filter((letter) => !gameState.puzzle.revealedLetters.has(letter)),
      );
      const bonusPoints = uniqueUnrevealedLetters.size * 1000;

      playWinSound();
      toast.success(`🎉 SPRÁVNĚ! Bonus 1000 × ${uniqueUnrevealedLetters.size} = ${bonusPoints} bodů!`, {
        duration: 5000,
      });

      setGameState((prev) => ({
        ...prev,
        puzzle: {
          ...prev.puzzle,
          revealedLetters: new Set(correctPhrase.split("")),
        },
        players: prev.players.map((p) => (p.id === prev.currentPlayer ? { ...p, score: p.score + bonusPoints } : p)),
      }));

      // Auto-advance to next round after delay
      setTimeout(() => {
        newRound();
      }, 3000);
    } else {
      // Wrong guess - lose turn
      playNothingSound();
      toast.error(`❌ Špatně! Tah přechází na dalšího hráče.`, {
        duration: 3000,
      });
      setGameState((prev) => ({
        ...prev,
        currentPlayer: (prev.currentPlayer + 1) % 3,
      }));
    }
  }, [gameState.puzzle.phrase, gameState.puzzle.revealedLetters, saveStateToHistory, newRound]);

  // Can player guess? Only when not spinning, not placing tokens, game is active, and not showing result
  const canGuessPhrase = !gameState.isSpinning && !isPlacingTokens && gamePhase === "playing" && !showResult;

  // Auto-detect puzzle completion
  useEffect(() => {
    if (gamePhase !== "playing" || gameState.isSpinning) return;

    const phrase = gameState.puzzle.phrase.toUpperCase();
    const lettersInPhrase = new Set(phrase.split("").filter((char) => /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(char)));

    const allRevealed = [...lettersInPhrase].every((letter) => {
      const variants = getLetterVariants(letter);
      return variants.some((v) => gameState.puzzle.revealedLetters.has(v));
    });

    if (allRevealed && lettersInPhrase.size > 0) {
      playWinSound();
      toast.success("🎉 TAJENKA VYŘEŠENA! Přechod na další kolo...", { duration: 3000 });
      setTimeout(() => {
        newRound();
      }, 3000);
    }
  }, [gameState.puzzle.revealedLetters, gamePhase, gameState.isSpinning]);

  const handleSpin = useCallback((power: number = 50) => {
    if (gameState.isSpinning) return;

    // Ensure minimum power of 50%
    const effectivePower = Math.max(50, power);
    
    console.log(`🚀 Spinning started with power: ${effectivePower}%`);
    setGameState((prev) => ({ ...prev, isSpinning: true }));
    setShowLetterSelector(false);

    // Power affects visual only: more spins and longer duration
    // Range: 5-10 extra spins based on power (50-100%)
    const powerFactor = (effectivePower - 50) / 50; // 0 to 1
    const extraSpins = 5 + powerFactor * 5; // 5 to 10 spins
    
    const targetSegmentIndex = Math.floor(Math.random() * 32); // ALWAYS random!
    const segmentAngle = (Math.PI * 2) / 32;

    const currentRotation = wheelRotationRef.current;

    // EXACT INVERSE of displaySegmentIdx calculation from animate():
    // displaySegmentIdx = floor((pointerAngle - rotation - geometryOffset) / segmentAngle)
    // So for segment center: rotation = pointerPos - geometryOffset - (index + 0.5) * segmentAngle
    const geometryOffset = -Math.PI / 2;
    const pointerPos = (3 * Math.PI) / 2;
    const targetRotationInCircle = pointerPos - geometryOffset - (targetSegmentIndex + 0.5) * segmentAngle;

    const tau = Math.PI * 2;
    const normalizedTarget = ((targetRotationInCircle % tau) + tau) % tau;

    // IMPORTANT: extraSpins is fractional (based on power), but FULL rotations must be an integer,
    // otherwise the final normalized rotation will drift and land on the wrong segment.
    const fullSpins = Math.round(extraSpins); // 5..10

    const normalizedCurrent = ((currentRotation % tau) + tau) % tau;
    const deltaToTarget = (normalizedTarget - normalizedCurrent + tau) % tau;

    // Guarantee: newRotation % tau === normalizedTarget
    const newRotation = currentRotation + fullSpins * tau + deltaToTarget;

    // Duration: 4-7 seconds based on power
    const duration = 4000 + powerFactor * 3000;
    const startTime = Date.now();
    const startRotation = currentRotation;
    let lastSegmentIndex = -1;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease = 1 - Math.pow(1 - progress, 5);
      const currentRot = startRotation + (newRotation - startRotation) * ease;

      // Calculate current segment for ticker display
      const normalizedRotation = ((currentRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const pointerAngle = (3 * Math.PI) / 2;
      const geometryOffsetCalc = -Math.PI / 2;
      const targetAngle = (pointerAngle - normalizedRotation - geometryOffsetCalc + Math.PI * 2) % (Math.PI * 2);
      const displaySegmentIdx = Math.floor(targetAngle / segmentAngle) % 32;
      setCurrentDisplaySegment(wheelSegments[displaySegmentIdx]);

      const currentSegmentIdx =
        Math.floor((((currentRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / segmentAngle) % 32;
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
        setCurrentDisplaySegment(wheelSegments[targetSegmentIndex]);

        console.log("✅ Animation finished. Target segment:", targetSegmentIndex);
        setTimeout(() => {
          handleSpinComplete(wheelSegments[targetSegmentIndex]);
        }, 0);
      }
    };

    requestAnimationFrame(animate);
  }, [gameState.isSpinning, handleSpinComplete]);

  const handleBonusWheelComplete = (finalScores: Player[]) => {
    setGameState((prev) => ({ ...prev, players: finalScores }));
    setGamePhase("victory");
  };

  const handlePlayAgain = async () => {
    // End old session and reset
    await endSession();
    setLocalSessionCode(null);
    window.history.replaceState(null, '', '/');
    
    // Reset with same puzzles
    setCurrentPuzzleIndex(0);
    const puzzle =
      gameMode === "teacher" && customPuzzles.length > 0
        ? { id: "custom-0", phrase: customPuzzles[0].phrase, category: customPuzzles[0].category }
        : getRandomPuzzle();

    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => ({ ...p, score: 0 })),
      puzzle: { ...puzzle, revealedLetters: new Set() },
      usedLetters: new Set(),
      round: 1,
      currentPlayer: 0,
      isSpinning: false,
    }));
    setTokenPositions(new Map());
    setTokensPlaced(new Set());
    setIsPlacingTokens(true);
    setShowLetterSelector(false);
    setGamePhase("playing");
  };

  const handleNewGame = async () => {
    // Cleanup session from database
    await endSession();
    setLocalSessionCode(null);
    window.history.replaceState(null, '', '/');
    
    setGamePhase("intro");
    setCustomPuzzles([]);
    setCurrentPuzzleIndex(0);
  };

  const handleEndGameBonusWheel = () => {
    setShowEndGameDialog(false);
    const winner = [...gameState.players].sort((a, b) => b.score - a.score)[0];
    toast.success(`${winner.name} jde do BONUS KOLA!`);
    setGamePhase("bonus-wheel");
  };

  const handleEndGameReturnToMenu = async () => {
    setShowEndGameDialog(false);
    
    // Cleanup session from database
    await endSession();
    setLocalSessionCode(null);
    window.history.replaceState(null, '', '/');
    
    setGamePhase("intro");
    setCustomPuzzles([]);
    setCurrentPuzzleIndex(0);
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => ({ ...p, score: 0 })),
      usedLetters: new Set(),
      round: 1,
      currentPlayer: 0,
      isSpinning: false,
    }));
    setTokenPositions(new Map());
    setTokensPlaced(new Set());
    setIsPlacingTokens(true);
    setShowLetterSelector(false);
  };

  // Process commands from remote controllers - read directly from session
  useEffect(() => {
    // Read command directly from session, not from ref
    const pendingCommand = session?.game_state?._pendingCommand as GameCommand | undefined;
    const timestamp = session?.game_state?._commandTimestamp as number | undefined;
    
    // Skip if no command or already processed
    if (!pendingCommand || !timestamp) return;
    if (processedCommandsRef.current.has(timestamp)) return;
    
    // Mark as processed immediately
    processedCommandsRef.current.set(timestamp, Date.now());
    
    console.log('Processing remote command:', pendingCommand);
    
    let commandResult: { type: 'success' | 'error'; message: string } | null = null;
    
    // Read current state from session for accurate command processing
    const sessionIsPlacingTokens = session?.game_state?.isPlacingTokens ?? isPlacingTokens;
    const sessionShowLetterSelector = session?.game_state?.showLetterSelector ?? showLetterSelector;
    
    switch (pendingCommand.type) {
      case 'SPIN_WHEEL':
        // Use session state to avoid sync issues
        if (!gameState.isSpinning && !sessionShowLetterSelector && !sessionIsPlacingTokens) {
          // Validate and clamp spin power to range 10-100
          const rawPower = 'power' in pendingCommand ? pendingCommand.power : 50;
          const spinPower = Math.max(10, Math.min(100, typeof rawPower === 'number' ? rawPower : 50));
          handleSpin(spinPower);
          commandResult = { type: 'success', message: 'Kolo se točí!' };
        } else {
          console.log('SPIN blocked:', { isSpinning: gameState.isSpinning, showLetterSelector: sessionShowLetterSelector, isPlacingTokens: sessionIsPlacingTokens });
          commandResult = { type: 'error', message: 'Nelze točit' };
        }
        break;
      case 'SELECT_LETTER':
        if (showLetterSelector && 'letter' in pendingCommand) {
          handleLetterSelect(pendingCommand.letter);
          commandResult = { type: 'success', message: `Písmeno ${pendingCommand.letter}` };
        } else {
          commandResult = { type: 'error', message: 'Nelze vybrat písmeno' };
        }
        break;
      case 'GUESS_PHRASE':
        if ('phrase' in pendingCommand) {
          handleGuessPhrase(pendingCommand.phrase);
          commandResult = { type: 'success', message: 'Hádání odesláno' };
        }
        break;
      case 'NEXT_PLAYER':
        handleSwitchPlayer((gameState.currentPlayer + 1) % 3);
        commandResult = { type: 'success', message: 'Další hráč' };
        break;
      case 'UNDO':
        handleUndo();
        commandResult = { type: 'success', message: 'Krok vrácen' };
        break;
      case 'SET_PLAYER':
        if ('playerId' in pendingCommand) {
          handleSwitchPlayer(pendingCommand.playerId);
          commandResult = { type: 'success', message: 'Hráč změněn' };
        }
        break;
      case 'PLACE_TOKEN':
        if ('segmentIndex' in pendingCommand && sessionIsPlacingTokens) {
          handleTokenPlace(pendingCommand.segmentIndex);
          commandResult = { type: 'success', message: 'Žeton umístěn' };
        } else {
          commandResult = { type: 'error', message: 'Nelze umístit žeton' };
        }
        break;
    }
    
    // Store command result to be sent with next state sync (after React updates)
    if (commandResult) {
      setPendingCommandResult({
        ...commandResult,
        clearCommand: true
      });
    }
  }, [session?.game_state?._commandTimestamp, session?.game_state?._pendingCommand, handleSpin, handleLetterSelect, handleGuessPhrase, handleSwitchPlayer, handleUndo, handleTokenPlace, gameState.isSpinning, showLetterSelector, isPlacingTokens, session?.game_state?.isPlacingTokens, session?.game_state?.showLetterSelector]);

  // Keyboard shortcuts for desktop users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Ignore if not playing
      if (gamePhase !== 'playing') return;
      
      // Space = Spin (with default 50% power for keyboard)
      if (e.code === 'Space' && !gameState.isSpinning && !showLetterSelector && !isPlacingTokens) {
        e.preventDefault();
        handleSpin(50);
        return;
      }
      
      // A-Z = Select letter (when keyboard is visible)
      if (/^Key[A-Z]$/.test(e.code) && showLetterSelector) {
        e.preventDefault();
        const letter = e.code.replace('Key', '');
        handleLetterSelect(letter);
        return;
      }
      
      // Enter = Open guess dialog
      if (e.code === 'Enter' && canGuessPhrase && !showGuessDialog) {
        e.preventDefault();
        setShowGuessDialog(true);
        return;
      }
      
      // Escape = Close dialogs/results
      if (e.code === 'Escape') {
        e.preventDefault();
        if (showGuessDialog) setShowGuessDialog(false);
        if (showResult) handleResultDismiss();
        if (showEndGameDialog) setShowEndGameDialog(false);
        return;
      }
      
      // Ctrl+Z = Undo
      if (e.ctrlKey && e.code === 'KeyZ' && gameHistory.length > 0) {
        e.preventDefault();
        handleUndo();
        return;
      }
      
      // Tab = Next player
      if (e.code === 'Tab' && !gameState.isSpinning) {
        e.preventDefault();
        handleSwitchPlayer((gameState.currentPlayer + 1) % 3);
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, gameState.isSpinning, showLetterSelector, isPlacingTokens, showGuessDialog, showResult, showEndGameDialog, gameHistory.length, canGuessPhrase]);

  // Intro screen - mode selection
  if (gamePhase === "intro") {
    return <GameModeSelect onSelectRandom={handleSelectRandom} onSelectTeacher={handleSelectTeacher} />;
  }

  // Teacher puzzle input
  if (gamePhase === "teacher-input") {
    return <TeacherPuzzleInput onComplete={handleTeacherPuzzlesComplete} onBack={() => setGamePhase("intro")} />;
  }

  // Handover screen
  if (gamePhase === "handover") {
    return <DeviceHandover puzzleCount={customPuzzles.length} onContinue={handleHandoverContinue} />;
  }

  // Player setup screen
  if (gamePhase === "setup") {
    return <PlayerSetup onComplete={handleSetupComplete} />;
  }

  // Bonus Wheel phase
  if (gamePhase === "bonus-wheel") {
    const winner = [...gameState.players].sort((a, b) => b.score - a.score)[0];
    return <BonusWheel winner={winner} players={gameState.players} onComplete={handleBonusWheelComplete} />;
  }

  // Victory screen phase
  if (gamePhase === "victory") {
    return <VictoryScreen players={gameState.players} onPlayAgain={handlePlayAgain} onNewGame={handleNewGame} />;
  }

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col bg-gradient-to-br ${colors.gradient} text-foreground transition-colors duration-1000`}
    >
      {/* Player Settings Popover */}
      <PlayerSettings
        effectsEnabled={effectsEnabled}
        onEffectsChange={setEffectsEnabled}
        showEndGame={!gameState.isSpinning && !showResult}
        onEndGame={() => setShowEndGameDialog(true)}
        players={gameState.players}
        currentPlayer={gameState.currentPlayer}
        onSwitchPlayer={handleSwitchPlayer}
        canUndo={gameHistory.length > 0}
        onUndo={handleUndo}
        isPlaying={gamePhase === "playing"}
        sessionCode={activeSessionCode}
        onCreateSession={handleCreateSession}
        isCreatingSession={isCreatingSession}
      />

      {/* Seasonal Effects Background */}
      {effectsEnabled && <SeasonalEffects />}
      {/* Studio Effects Background */}
      {effectsEnabled && <StudioEffects />}

      {/* Camera Detail View with Timer - Responsive */}
      <div className="absolute top-4 left-4 z-40 flex flex-col items-center animate-fade-in">
        <div className="w-64 h-48 md:w-80 md:h-60 lg:w-96 lg:h-72 rounded-lg overflow-hidden border-4 border-primary/60 shadow-2xl backdrop-blur-sm bg-black/80 relative">
          <div className="absolute top-2 left-2 z-10 bg-red-600 text-white px-2 py-0.5 md:px-3 md:py-1 rounded text-[10px] md:text-xs font-bold uppercase tracking-wide shadow-md">
            🎥 KAMERA
          </div>
          <WheelDetailView
            rotation={wheelRotation}
            rotationRef={wheelRotationRef}
            tokenPositions={tokenPositions}
            players={gameState.players}
            pointerBounce={pointerBounce}
            currentSegment={currentDisplaySegment}
            isSpinning={gameState.isSpinning}
          />
        </div>
        
        {/* Turn Timer under camera */}
        <div className="mt-2">
          <TurnTimer
            duration={turnTimer}
            isActive={timerActive && showLetterSelector && !gameState.isSpinning}
            onTimeUp={handleTimeUp}
            onReset={timerResetKey}
          />
        </div>
      </div>

      <PlayerScores players={gameState.players} currentPlayer={gameState.currentPlayer} />

      <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-48 min-h-0">
        <div className="text-center mb-4">
          <h1 className="text-5xl font-bold text-primary mb-1 tracking-wider drop-shadow-[0_0_30px_hsl(var(--primary)_/_0.5)]">
            KOLOTOČ
          </h1>
          <p className="text-xl text-muted-foreground font-semibold">Kolo {gameState.round}</p>
        </div>

        <div className="relative w-full h-[400px] sm:h-[500px] md:h-[550px] lg:h-[650px] flex items-center justify-center">
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
            pointerBounce={pointerBounce}
          />
        </div>

        {isPlacingTokens && (
          <div className="absolute top-52 md:top-32 right-4 pointer-events-none z-50">
            <div className="bg-black/70 backdrop-blur-xl px-4 py-3 md:px-5 md:py-4 rounded-xl border border-primary/40 shadow-[0_0_30px_hsl(var(--primary)/0.3)] text-center animate-in slide-in-from-right duration-300">
              <p
                className="text-lg md:text-xl font-bold mb-1"
                style={{ color: gameState.players[gameState.currentPlayer]?.color }}
              >
                {gameState.players[gameState.currentPlayer]?.name || `HRÁČ ${gameState.currentPlayer + 1}`}
              </p>
              <p className="text-xs md:text-sm text-white/80 font-medium">Umístěte žeton na kolo</p>
            </div>
          </div>
        )}

        {/* Controls */}
        {!gameState.isSpinning && !showLetterSelector && !isPlacingTokens && !showResult && (
          <div className="fixed bottom-28 md:bottom-8 right-4 md:right-8 z-40 animate-in slide-in-from-right duration-500 w-48 md:w-64">
            <SpinButton
              onSpin={handleSpin}
              isSpinning={gameState.isSpinning}
              playerName={gameState.players[gameState.currentPlayer]?.name}
              playerColor={gameState.players[gameState.currentPlayer]?.color}
            />
          </div>
        )}
      </div>

      <BottomDock
        puzzle={gameState.puzzle}
        usedLetters={gameState.usedLetters}
        showLetterSelector={showLetterSelector}
        onLetterSelect={handleLetterSelect}
        onGuessPhrase={() => setShowGuessDialog(true)}
        disabled={gameState.isSpinning}
        canGuess={canGuessPhrase}
        showResult={showResult}
        resultMessage={resultMessage}
        resultType={resultType}
        onResultDismiss={handleResultDismiss}
      />

      <GuessPhraseDialog
        open={showGuessDialog}
        onOpenChange={setShowGuessDialog}
        onGuess={handleGuessPhrase}
        category={gameState.puzzle.category}
        revealedLetters={gameState.puzzle.revealedLetters}
        phrase={gameState.puzzle.phrase}
        unrevealedCount={(() => {
          const allLetters = gameState.puzzle.phrase.split("").filter((char) => /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/i.test(char));
          const uniqueUnrevealed = new Set(
            allLetters.filter((l) => !gameState.puzzle.revealedLetters.has(l.toUpperCase())),
          );
          return uniqueUnrevealed.size;
        })()}
      />

      <EndGameDialog
        open={showEndGameDialog}
        onOpenChange={setShowEndGameDialog}
        onBonusWheel={handleEndGameBonusWheel}
        onReturnToMenu={handleEndGameReturnToMenu}
        players={gameState.players}
      />
    </div>
  );
};

export default Index;
