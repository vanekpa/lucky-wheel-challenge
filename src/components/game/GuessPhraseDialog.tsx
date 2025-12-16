import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, X } from 'lucide-react';

interface GuessPhraseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuess: (guess: string) => void;
  category: string;
  revealedLetters: Set<string>;
  phrase: string;
}

export const GuessPhraseDialog = ({
  open,
  onOpenChange,
  onGuess,
  category,
  revealedLetters,
  phrase,
}: GuessPhraseDialogProps) => {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onGuess(guess.trim().toUpperCase());
      setGuess('');
      onOpenChange(false);
    }
  };

  // Show hint - revealed letters in the phrase
  const getHint = () => {
    return phrase
      .split('')
      .map((char) => {
        if (char === ' ') return '   ';
        if (revealedLetters.has(char.toUpperCase())) return char;
        return '_';
      })
      .join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-purple-900/95 to-indigo-900/95 border-2 border-yellow-400/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-yellow-400 flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8" />
            Hádej celou tajenku!
            <Sparkles className="h-8 w-8" />
          </DialogTitle>
          <DialogDescription className="text-center text-white/70 text-lg">
            Za správnou odpověď získáte <span className="text-yellow-400 font-bold">5000 bodů</span> navíc!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category */}
          <div className="text-center">
            <span className="text-sm text-white/50 uppercase tracking-wider">Kategorie</span>
            <p className="text-xl font-bold text-cyan-400">{category || 'Bez kategorie'}</p>
          </div>

          {/* Hint */}
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <span className="text-sm text-white/50 uppercase tracking-wider block mb-2">Nápověda</span>
            <p className="text-2xl font-mono text-white tracking-[0.3em]">
              {getHint()}
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Napište vaši odpověď..."
              className="text-xl text-center py-6 bg-white/10 border-white/30 text-white placeholder:text-white/40 uppercase tracking-wide"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="mr-2 h-5 w-5" />
                Zrušit
              </Button>
              <Button
                type="submit"
                disabled={!guess.trim()}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-lg disabled:opacity-50"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Hádat!
              </Button>
            </div>
          </form>

          {/* Warning */}
          <p className="text-center text-red-400/80 text-sm">
            ⚠️ Pozor! Špatná odpověď = ztráta tahu
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
