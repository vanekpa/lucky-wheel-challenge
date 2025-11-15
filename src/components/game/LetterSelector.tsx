import { Button } from '@/components/ui/button';

interface LetterSelectorProps {
  usedLetters: Set<string>;
  onLetterSelect: (letter: string) => void;
  disabled: boolean;
}

const CZECH_ALPHABET = [
  'A', 'Á', 'B', 'C', 'Č', 'D', 'Ď', 'E', 'É', 'Ě',
  'F', 'G', 'H', 'I', 'Í', 'J', 'K', 'L', 'M', 'N',
  'Ň', 'O', 'Ó', 'P', 'Q', 'R', 'Ř', 'S', 'Š', 'T',
  'Ť', 'U', 'Ú', 'Ů', 'V', 'W', 'X', 'Y', 'Ý', 'Z', 'Ž'
];

export const LetterSelector = ({ usedLetters, onLetterSelect, disabled }: LetterSelectorProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-card/50 rounded-lg p-6 border-2 border-primary/30">
        <h3 className="text-center text-lg font-bold mb-4 text-primary">
          VYBERTE PÍSMENO
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {CZECH_ALPHABET.map((letter) => {
            const isUsed = usedLetters.has(letter);
            return (
              <Button
                key={letter}
                onClick={() => onLetterSelect(letter)}
                disabled={disabled || isUsed}
                variant={isUsed ? 'secondary' : 'default'}
                className={`w-12 h-12 text-lg font-bold ${
                  isUsed ? 'opacity-30' : ''
                }`}
              >
                {letter}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
