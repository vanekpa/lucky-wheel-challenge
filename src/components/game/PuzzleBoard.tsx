import { Puzzle } from '@/types/game';
import { useState, useEffect, useRef } from 'react';

interface PuzzleBoardProps {
  puzzle: Puzzle;
  highlightNew?: boolean;
}

export const PuzzleBoard = ({ puzzle, highlightNew = false }: PuzzleBoardProps) => {
  const words = puzzle.phrase.split(' ');
  const [newlyRevealed, setNewlyRevealed] = useState<Set<string>>(new Set());
  const prevRevealedRef = useRef<Set<string>>(new Set());

  // Track newly revealed letters for animation
  useEffect(() => {
    const currentRevealed = puzzle.revealedLetters;
    const prevRevealed = prevRevealedRef.current;
    
    // Only process if size changed (actual new letters)
    if (currentRevealed.size === prevRevealed.size) {
      return;
    }
    
    const newLetters = new Set<string>();
    currentRevealed.forEach(letter => {
      if (!prevRevealed.has(letter)) {
        newLetters.add(letter);
      }
    });
    
    // Update ref IMMEDIATELY before any state changes
    prevRevealedRef.current = new Set(currentRevealed);
    
    if (newLetters.size > 0) {
      setNewlyRevealed(newLetters);
      const timer = setTimeout(() => {
        setNewlyRevealed(new Set());
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [puzzle.revealedLetters]);

  const renderLetter = (char: string, index: number) => {
    const isLetter = /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/i.test(char);
    const isPunctuation = /[.,?!;:'"„"‚'–—-]/.test(char);
    const upperChar = char.toUpperCase();
    const isRevealed = puzzle.revealedLetters.has(upperChar);
    const isNewlyRevealed = newlyRevealed.has(upperChar);

    // Empty space for actual spaces
    if (!isLetter && !isPunctuation) {
      return (
        <div key={index} className="w-8 h-10 mx-0.5" />
      );
    }

    // Punctuation is always visible - neutral style
    if (isPunctuation) {
      return (
        <div
          key={index}
          className="w-8 h-10 mx-0.5 flex items-center justify-center text-lg font-bold
            bg-white/15 backdrop-blur-sm rounded-lg
            border border-white/20 text-primary-foreground"
        >
          {char}
        </div>
      );
    }

    // Letters - revealed or hidden
    const revealedClasses = isRevealed
      ? `bg-white/15 backdrop-blur-sm border text-primary-foreground ${
          isNewlyRevealed 
            ? 'animate-flip-tile border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.6)]' 
            : 'border-white/20'
        }`
      : 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10';

    return (
      <div
        key={index}
        className={`w-8 h-10 mx-0.5 flex items-center justify-center text-lg font-bold rounded-lg transition-all duration-300 ${revealedClasses}`}
      >
        {isRevealed ? upperChar : ''}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-3 border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
        <div className="text-center mb-2">
          <span className="text-sm font-semibold text-primary/80 uppercase tracking-widest">
            {puzzle.category}
          </span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-1">
          {words.map((word, wordIndex) => (
            <div key={wordIndex} className="flex justify-center mr-2 last:mr-0">
              {word.split('').map((char, charIndex) =>
                renderLetter(char, wordIndex * 100 + charIndex)
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
