import { GameState, Player } from "@/types/game";

type GamePhase = "intro" | "teacher-input" | "handover" | "setup" | "playing" | "bonus-wheel" | "victory";

interface CustomPuzzle {
  phrase: string;
  category: string;
}

export interface SavedGameState {
  gameState: {
    currentPlayer: number;
    players: Player[];
    puzzle: {
      id: string;
      phrase: string;
      category: string;
      revealedLetters: string[];
    };
    usedLetters: string[];
    round: number;
    isSpinning: boolean;
  };
  gamePhase: GamePhase;
  gameMode: "random" | "teacher";
  customPuzzles: CustomPuzzle[];
  currentPuzzleIndex: number;
  tokenPositions: [number, number][];
  tokensPlaced: number[];
  vowelsForceUnlocked: boolean;
  savedAt: number;
}

const STORAGE_KEY = "kolotoc_saved_game";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save current game state to localStorage
 */
export const saveGameToLocal = (
  gameState: GameState,
  gamePhase: GamePhase,
  gameMode: "random" | "teacher",
  customPuzzles: CustomPuzzle[],
  currentPuzzleIndex: number,
  tokenPositions: Map<number, number>,
  tokensPlaced: Set<number>,
  vowelsForceUnlocked: boolean
): void => {
  // Only save during active gameplay
  if (gamePhase !== "playing") return;

  const savedState: SavedGameState = {
    gameState: {
      currentPlayer: gameState.currentPlayer,
      players: gameState.players,
      puzzle: {
        id: gameState.puzzle.id,
        phrase: gameState.puzzle.phrase,
        category: gameState.puzzle.category,
        revealedLetters: Array.from(gameState.puzzle.revealedLetters),
      },
      usedLetters: Array.from(gameState.usedLetters),
      round: gameState.round,
      isSpinning: false, // Never save spinning state
    },
    gamePhase,
    gameMode,
    customPuzzles,
    currentPuzzleIndex,
    tokenPositions: Array.from(tokenPositions.entries()),
    tokensPlaced: Array.from(tokensPlaced),
    vowelsForceUnlocked,
    savedAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
  } catch (e) {
    console.warn("Failed to save game to localStorage:", e);
  }
};

/**
 * Load saved game from localStorage
 */
export const loadGameFromLocal = (): SavedGameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed: SavedGameState = JSON.parse(saved);

    // Check if save is too old
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearSavedGame();
      return null;
    }

    return parsed;
  } catch (e) {
    console.warn("Failed to load saved game:", e);
    return null;
  }
};

/**
 * Clear saved game from localStorage
 */
export const clearSavedGame = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear saved game:", e);
  }
};

/**
 * Check if there's a valid saved game
 */
export const hasSavedGame = (): boolean => {
  return loadGameFromLocal() !== null;
};

/**
 * Get formatted info about saved game (for display)
 */
export const getSavedGameInfo = (saved: SavedGameState): {
  roundInfo: string;
  players: { name: string; score: number; color: string }[];
  savedAgo: string;
} => {
  const players = saved.gameState.players.map((p) => ({
    name: p.name,
    score: p.score,
    color: p.color,
  }));

  const roundInfo = `Kolo ${saved.gameState.round}`;

  // Calculate time ago
  const diffMs = Date.now() - saved.savedAt;
  const diffMins = Math.floor(diffMs / 60000);
  let savedAgo: string;
  if (diffMins < 1) {
    savedAgo = "právě teď";
  } else if (diffMins < 60) {
    savedAgo = `před ${diffMins} min`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    savedAgo = `před ${diffHours} hod`;
  }

  return { roundInfo, players, savedAgo };
};
