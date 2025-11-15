import { useState } from 'react';
import { PuzzleBoard } from './PuzzleBoard';
import { LetterSelector } from './LetterSelector';
import { Puzzle } from '@/types/game';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface BottomDockProps {
  puzzle: Puzzle;
  usedLetters: Set<string>;
  showLetterSelector: boolean;
  onLetterSelect: (letter: string) => void;
  disabled: boolean;
}

export const BottomDock = ({
  puzzle,
  usedLetters,
  showLetterSelector,
  onLetterSelect,
  disabled,
}: BottomDockProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 transition-all duration-500 ease-out ${
        showLetterSelector || isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-180px)]'
      }`}
      style={{
        background: 'linear-gradient(to top, hsl(var(--background)), hsl(var(--background) / 0.95))',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Toggle Handle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-card/80 backdrop-blur-md rounded-t-lg px-6 py-2 border-t-2 border-x-2 border-primary/30 hover:border-primary/50 transition-colors"
      >
        {isExpanded || showLetterSelector ? (
          <ChevronDown className="w-6 h-6 text-primary" />
        ) : (
          <ChevronUp className="w-6 h-6 text-primary" />
        )}
      </button>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Compact Puzzle Board */}
        <div className="transform scale-90">
          <PuzzleBoard puzzle={puzzle} />
        </div>

        {/* Letter Selector */}
        {showLetterSelector && (
          <div className="animate-fade-in">
            <LetterSelector
              usedLetters={usedLetters}
              onLetterSelect={onLetterSelect}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
};
