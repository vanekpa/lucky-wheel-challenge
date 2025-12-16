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
        <div key={index} className="w-14 h-16 mx-0.5" />
      );
    }

    // Punctuation is always visible
    if (isPunctuation) {
      return (
        <div
          key={index}
          className="w-12 h-14 mx-0.5 border-3 border-primary flex items-center justify-center text-2xl font-bold bg-card text-foreground"
        >
          {char}
        </div>
      );
    }

    // Letters - revealed or hidden
    return (
      <div
        key={index}
        className={`w-12 h-14 mx-0.5 border-3 border-primary flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
          isRevealed
            ? 'bg-card text-foreground animate-flip-tile'
            : 'bg-muted/30 text-transparent'
        }`}
      >
        {isRevealed ? char.toUpperCase() : '?'}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-secondary/20 rounded-lg p-4 border-2 border-primary/50">
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-primary uppercase tracking-wider">
            {puzzle.category}
          </h3>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          {words.map((word, wordIndex) => (
            <div key={wordIndex} className="flex justify-center">
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
