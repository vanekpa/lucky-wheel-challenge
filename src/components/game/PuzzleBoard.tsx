import { Puzzle } from '@/types/game';

interface PuzzleBoardProps {
  puzzle: Puzzle;
}

export const PuzzleBoard = ({ puzzle }: PuzzleBoardProps) => {
  const words = puzzle.phrase.split(' ');

  const renderLetter = (char: string, index: number) => {
    const isLetter = /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/i.test(char);
    const isPunctuation = /[.,?!;:'"„"‚'–—-]/.test(char);
    const isRevealed = puzzle.revealedLetters.has(char.toUpperCase());

    // Empty space for actual spaces
    if (!isLetter && !isPunctuation) {
      return (
        <div key={index} className="w-8 h-10 mx-0.5" />
      );
    }

    // Punctuation is always visible - same style as revealed
    if (isPunctuation) {
      return (
        <div
          key={index}
          className="w-8 h-10 mx-0.5 flex items-center justify-center text-lg font-bold
            bg-white/15 backdrop-blur-sm rounded-lg
            border border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.25)]
            text-primary-foreground"
        >
          {char}
        </div>
      );
    }

    // Letters - revealed or hidden
    return (
      <div
        key={index}
        className={`w-8 h-10 mx-0.5 flex items-center justify-center text-lg font-bold rounded-lg transition-all duration-300 ${
          isRevealed
            ? 'bg-white/15 backdrop-blur-sm border border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.25)] text-primary-foreground animate-flip-tile'
            : 'bg-gradient-to-br from-white/5 to-white/10 border border-white/10'
        }`}
      >
        {isRevealed ? char.toUpperCase() : ''}
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
