import { useState, useEffect } from 'react';
import { PuzzleBoard } from './PuzzleBoard';
import { LetterSelector } from './LetterSelector';
import { Puzzle } from '@/types/game';
import { ChevronUp, ChevronDown, X, Sparkles, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomDockProps {
  puzzle: Puzzle;
  usedLetters: Set<string>;
  showLetterSelector: boolean;
  onLetterSelect: (letter: string) => void;
  onGuessPhrase: () => void;
  disabled: boolean;
  canGuess: boolean;
  showResult?: boolean;
  resultMessage?: string;
  resultType?: 'success' | 'error';
  onResultDismiss?: () => void;
}

export const BottomDock = ({
  puzzle,
  usedLetters,
  showLetterSelector,
  onLetterSelect,
  onGuessPhrase,
  disabled,
  canGuess,
  showResult = false,
  resultMessage = '',
  resultType = 'success',
  onResultDismiss,
}: BottomDockProps) => {
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  
  // Can be expanded either manually, when letter selector is shown, or when showing result
  const isExpanded = isManuallyExpanded || showLetterSelector || showResult;

  const handleClose = () => {
    setIsManuallyExpanded(false);
    if (showResult && onResultDismiss) {
      onResultDismiss();
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 transition-all duration-500 ease-out z-30 ${
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-90px)]'
      }`}
    >
      {/* Gradient overlay for smooth blend */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none"
        style={{ backdropFilter: 'blur(12px)' }}
      />

      {/* Toggle Handle */}
      <button
        onClick={() => setIsManuallyExpanded(!isManuallyExpanded)}
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full 
          bg-white/10 backdrop-blur-md rounded-t-xl px-5 py-1.5 
          border-t border-x border-primary/30 hover:border-primary/50 
          hover:bg-white/15 transition-all"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-primary" />
        ) : (
          <ChevronUp className="w-5 h-5 text-primary" />
        )}
      </button>

      {/* Close button when expanded */}
      {isExpanded && !showResult && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-2 right-3 z-10 hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {/* Guess Phrase Button */}
      {canGuess && !showResult && (
        <Button
          onClick={onGuessPhrase}
          className="absolute top-2 left-3 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-sm px-3 py-1.5 h-auto shadow-lg shadow-yellow-500/20 animate-pulse"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Hádat tajenku
        </Button>
      )}

      <div className="relative container mx-auto px-3 py-3 space-y-3">
        {/* Result Banner */}
        {showResult && resultMessage && (
          <div className={`flex items-center justify-center gap-3 py-3 px-6 rounded-xl mb-2 animate-pop-in ${
            resultType === 'success' 
              ? 'bg-green-500/20 border border-green-500/40' 
              : 'bg-red-500/20 border border-red-500/40'
          }`}>
            {resultType === 'success' ? (
              <Check className="w-6 h-6 text-green-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <span className={`text-lg font-bold ${
              resultType === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {resultMessage}
            </span>
          </div>
        )}

        {/* Puzzle Board */}
        <PuzzleBoard puzzle={puzzle} highlightNew={showResult && resultType === 'success'} />

        {/* Letter Selector - only when game requires it and not showing result */}
        {showLetterSelector && !showResult && (
          <div className="animate-fade-in">
            <LetterSelector
              usedLetters={usedLetters}
              onLetterSelect={onLetterSelect}
              disabled={disabled}
            />
          </div>
        )}

        {/* Continue button when showing result */}
        {showResult && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={onResultDismiss}
              variant="outline"
              className="px-8 py-2 text-lg font-semibold border-primary/50 hover:bg-primary/20"
            >
              Pokračovat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

