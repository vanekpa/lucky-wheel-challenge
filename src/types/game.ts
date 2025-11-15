export interface Player {
  id: number;
  name: string;
  score: number;
  color: string;
  tokenPosition?: number;
}

export interface WheelSegment {
  id: number;
  value: number | string;
  color: string;
  type: 'points' | 'bankrot' | 'nic' | 'special';
}

export interface Puzzle {
  id: string;
  phrase: string;
  category: string;
  revealedLetters: Set<string>;
}

export interface GameState {
  currentPlayer: number;
  players: Player[];
  puzzle: Puzzle;
  usedLetters: Set<string>;
  round: number;
  isSpinning: boolean;
  wheelResult?: WheelSegment;
}
