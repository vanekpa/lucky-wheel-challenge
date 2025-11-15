import { Puzzle } from '@/types/game';

interface PuzzleBoardProps {
  puzzle: Puzzle;
}

export const PuzzleBoard = ({ puzzle }: PuzzleBoardProps) => {
  const words = puzzle.phrase.split(' ');

  const renderLetter = (char: string, index: number) => {
    const isLetter = /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/i.test(char);
    const isRevealed = puzzle.revealedLetters.has(char.toUpperCase());

    if (!isLetter) {
      return (
        <div key={index} className="w-14 h-16 mx-0.5" />
      );
    }

    return (
      <div
        key={index}
        className={`w-14 h-16 mx-0.5 border-4 border-primary flex items-center justify-center text-3xl font-bold transition-all duration-300 ${
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
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-secondary/20 rounded-lg p-8 border-4 border-primary">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-primary uppercase tracking-wider">
            {puzzle.category}
          </h3>
        </div>
        
        <div className="flex flex-col items-center gap-3">
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
