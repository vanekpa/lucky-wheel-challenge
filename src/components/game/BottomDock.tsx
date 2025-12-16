import { useState } from 'react';
import { PuzzleBoard } from './PuzzleBoard';
import { LetterSelector } from './LetterSelector';
import { Puzzle } from '@/types/game';
import { ChevronUp, ChevronDown, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomDockProps {
  puzzle: Puzzle;
  usedLetters: Set<string>;
  showLetterSelector: boolean;
  onLetterSelect: (letter: string) => void;
  onGuessPhrase: () => void;
  disabled: boolean;
  canGuess: boolean;
}

export const BottomDock = ({
  puzzle,
  usedLetters,
  showLetterSelector,
  onLetterSelect,
  onGuessPhrase,
  disabled,
  canGuess,
}: BottomDockProps) => {
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  
  // Can be expanded either manually or when letter selector is shown
  const isExpanded = isManuallyExpanded || showLetterSelector;

  const handleClose = () => {
    setIsManuallyExpanded(false);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 transition-all duration-500 ease-out z-30 ${
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-140px)]'
      }`}
      style={{
        background: 'linear-gradient(to top, hsl(var(--background)), hsl(var(--background) / 0.95))',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Toggle Handle */}
      <button
        onClick={() => setIsManuallyExpanded(!isManuallyExpanded)}
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-card/80 backdrop-blur-md rounded-t-lg px-6 py-2 border-t-2 border-x-2 border-primary/30 hover:border-primary/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-6 h-6 text-primary" />
        ) : (
          <ChevronUp className="w-6 h-6 text-primary" />
        )}
      </button>

      {/* Close button when expanded */}
      {isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-2 right-4"
        >
          <X className="w-5 h-5" />
        </Button>
      )}

      {/* Guess Phrase Button */}
      {canGuess && (
        <Button
          onClick={onGuessPhrase}
          className="absolute top-2 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold shadow-lg animate-pulse"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Hádat tajenku
        </Button>
      )}

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Compact Puzzle Board */}
        <div className="transform scale-90 origin-top">
          <PuzzleBoard puzzle={puzzle} />
        </div>

        {/* Letter Selector - only when game requires it */}
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

