import { Button } from '@/components/ui/button';

interface LetterSelectorProps {
  usedLetters: Set<string>;
  onLetterSelect: (letter: string) => void;
  disabled: boolean;
}

// Unified keyboard - clicking base letter reveals all diacritic variants
const LETTER_GROUPS: Record<string, string[]> = {
  'A': ['A', 'Á'],
  'C': ['C', 'Č'],
  'D': ['D', 'Ď'],
  'E': ['E', 'É', 'Ě'],
  'I': ['I', 'Í'],
  'N': ['N', 'Ň'],
  'O': ['O', 'Ó'],
  'R': ['R', 'Ř'],
  'S': ['S', 'Š'],
  'T': ['T', 'Ť'],
  'U': ['U', 'Ú', 'Ů'],
  'Y': ['Y', 'Ý'],
  'Z': ['Z', 'Ž'],
};

const BASE_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

export const getLetterVariants = (letter: string): string[] => {
  return LETTER_GROUPS[letter] || [letter];
};

export const LetterSelector = ({ usedLetters, onLetterSelect, disabled }: LetterSelectorProps) => {
  const isGroupUsed = (letter: string) => {
    const variants = getLetterVariants(letter);
    return variants.some(v => usedLetters.has(v));
  };

  const handleSelect = (letter: string) => {
    // Pass the base letter, the game logic will check all variants
    onLetterSelect(letter);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card/50 rounded-lg p-4 border-2 border-primary/30">
        <h3 className="text-center text-lg font-bold mb-3 text-primary">
          VYBERTE PÍSMENO
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {BASE_ALPHABET.map((letter) => {
            const variants = getLetterVariants(letter);
            const isUsed = isGroupUsed(letter);
            const hasVariants = variants.length > 1;
            
            return (
              <Button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={disabled || isUsed}
                variant={isUsed ? 'secondary' : 'default'}
                className={`w-12 h-12 text-lg font-bold relative ${
                  isUsed ? 'opacity-30' : ''
                } ${hasVariants ? 'pr-1' : ''}`}
              >
                {letter}
                {hasVariants && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center">
                    +{variants.length - 1}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">
          Písmena s háčky a čárkami jsou sloučena (A=Á, C=Č, atd.)
        </p>
      </div>
    </div>
  );
};
