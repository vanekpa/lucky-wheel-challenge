// Unified keyboard with glassmorphism styling
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
    // Always pass the letter - game logic will handle if it's already used
    onLetterSelect(letter);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {/* Glow effect behind */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <h3 className="relative text-center text-base md:text-lg font-bold mb-3 md:mb-4 text-primary tracking-wider uppercase">
          Vyberte písmeno
        </h3>
        
        <div className="relative flex flex-wrap gap-1.5 md:gap-2 justify-center">
          {BASE_ALPHABET.map((letter) => {
            const variants = getLetterVariants(letter);
            const isUsed = isGroupUsed(letter);
            const hasVariants = variants.length > 1;
            
            return (
              <button
                key={letter}
                onClick={() => handleSelect(letter)}
                disabled={disabled}
                className={`
                  relative w-10 h-10 md:w-11 md:h-11 text-base md:text-lg font-bold rounded-xl
                  transition-all duration-150 ease-out touch-target-lg
                  ${isUsed 
                    ? `bg-white/5 text-white/40 border border-white/10
                       hover:bg-red-500/20 hover:border-red-500/50
                       hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]
                       cursor-pointer` 
                    : `bg-white/10 text-white border border-white/20
                       hover:bg-primary/30 hover:border-primary/50 hover:text-primary-foreground
                       hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]
                       hover:scale-110 hover:-translate-y-1
                       active:scale-90 active:bg-primary/50`
                  }
                `}
              >
                {letter}
                {hasVariants && !isUsed && (
                  <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 text-[8px] md:text-[9px] bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center font-semibold shadow-lg">
                    +{variants.length - 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        <p className="relative text-center text-[10px] md:text-xs text-white/40 mt-3 md:mt-4 tracking-wide">
          Písmena s háčky a čárkami jsou sloučena
        </p>
      </div>
    </div>
  );
};
