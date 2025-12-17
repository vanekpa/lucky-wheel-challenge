import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSession, type GameCommand } from '@/hooks/useGameSession';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, RotateCcw, MessageSquare, SkipForward, Undo2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LETTERS = 'AÁBCČDĎEÉĚFGHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYÝZŽ'.split('');

const RemoteController = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error, sendCommand, joinSession } = useGameSession();
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [showGuessInput, setShowGuessInput] = useState(false);

  useEffect(() => {
    if (code && !session) {
      joinSession(code);
    }
  }, [code]);

  // Show keyboard based on game state
  useEffect(() => {
    if (session?.game_state?.showLetterSelector) {
      setShowKeyboard(true);
    } else {
      setShowKeyboard(false);
    }
  }, [session?.game_state?.showLetterSelector]);

  const handleCommand = async (command: GameCommand) => {
    await sendCommand(command);
    toast.success('Příkaz odeslán');
  };

  const handleLetterSelect = async (letter: string) => {
    await sendCommand({ type: 'SELECT_LETTER', letter });
    setShowKeyboard(false);
    toast.success(`Písmeno "${letter}" odesláno`);
  };

  const handleGuessSubmit = async () => {
    if (guessInput.trim()) {
      await sendCommand({ type: 'GUESS_PHRASE', phrase: guessInput.trim() });
      setGuessInput('');
      setShowGuessInput(false);
      toast.success('Hádání odesláno');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Připojování ke hře...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-primary/10 flex items-center justify-center p-4">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center max-w-sm w-full">
          <p className="text-destructive mb-4">{error || 'Session nenalezena'}</p>
          <Button onClick={() => navigate('/join')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zkusit znovu
          </Button>
        </div>
      </div>
    );
  }

  const gameState = session.game_state;
  const currentPlayer = gameState?.players?.[gameState?.currentPlayer];
  const isPlacingTokens = gameState?.isPlacingTokens;
  const isSpinning = gameState?.isSpinning;
  const canSpin = !isSpinning && !showKeyboard && !isPlacingTokens;

  // Get revealed puzzle hint
  const getPuzzleHint = () => {
    if (!gameState?.puzzle) return '';
    const phrase = gameState.puzzle.phrase || '';
    const revealed = gameState.puzzle.revealedLetters || [];
    const revealedSet = new Set(Array.isArray(revealed) ? revealed : []);
    
    return phrase
      .split('')
      .map(char => {
        if (/[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/i.test(char)) {
          return revealedSet.has(char.toUpperCase()) ? char : '_';
        }
        return char;
      })
      .join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex flex-col">
      {/* Header */}
      <header className="bg-card/60 backdrop-blur-lg border-b border-border/50 p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Kolo {gameState?.round || 1}</p>
            <p className="font-semibold text-sm" style={{ color: currentPlayer?.color }}>
              {currentPlayer?.name || 'Hráč'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Skóre</p>
            <p className="font-bold text-primary">{currentPlayer?.score || 0}</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {/* Puzzle hint */}
        {gameState?.puzzle && (
          <div className="bg-card/60 backdrop-blur-lg rounded-xl p-4 mb-4 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">
              {gameState.puzzle.category}
            </p>
            <p className="font-mono text-lg tracking-wider break-all">
              {getPuzzleHint()}
            </p>
          </div>
        )}

        {/* Token placement mode */}
        {isPlacingTokens && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center mb-4">
            <Target className="w-12 h-12 mx-auto mb-3 text-primary" />
            <p className="text-lg font-semibold mb-2">Umístěte žeton</p>
            <p className="text-sm text-muted-foreground">
              Klepněte na segment na hlavní obrazovce
            </p>
          </div>
        )}

        {/* Main action buttons */}
        {!showKeyboard && !showGuessInput && (
          <div className="space-y-4">
            {/* Spin button */}
            <Button
              onClick={() => handleCommand({ type: 'SPIN_WHEEL' })}
              disabled={!canSpin}
              size="lg"
              className={cn(
                "w-full text-xl py-8 transition-all",
                canSpin 
                  ? "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-[1.02]" 
                  : "opacity-50"
              )}
            >
              <RotateCcw className={cn("w-6 h-6 mr-3", isSpinning && "animate-spin")} />
              {isSpinning ? 'Točí se...' : 'ZATOČIT'}
            </Button>

            {/* Guess phrase button */}
            <Button
              onClick={() => setShowGuessInput(true)}
              variant="secondary"
              size="lg"
              className="w-full text-lg py-6"
              disabled={isSpinning || isPlacingTokens}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Hádat tajenku
            </Button>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleCommand({ type: 'NEXT_PLAYER' })}
                variant="outline"
                className="py-4"
                disabled={isSpinning}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Další hráč
              </Button>
              <Button
                onClick={() => handleCommand({ type: 'UNDO' })}
                variant="outline"
                className="py-4"
                disabled={isSpinning}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Zpět
              </Button>
            </div>
          </div>
        )}

        {/* Letter keyboard */}
        {showKeyboard && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold text-primary">Vyberte písmeno</p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {LETTERS.map(letter => (
                <Button
                  key={letter}
                  onClick={() => handleLetterSelect(letter)}
                  variant="outline"
                  className="aspect-square text-lg font-bold hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                >
                  {letter}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setShowKeyboard(false)}
              variant="ghost"
              className="w-full mt-4"
            >
              Zrušit
            </Button>
          </div>
        )}

        {/* Guess input */}
        {showGuessInput && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-lg font-semibold">Hádat tajenku</p>
              <p className="text-sm text-muted-foreground">{gameState?.puzzle?.category}</p>
            </div>
            <textarea
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value.toUpperCase())}
              placeholder="Napište celou tajenku..."
              className="w-full p-4 rounded-xl bg-card border border-border text-lg font-mono resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                onClick={() => setShowGuessInput(false)}
                variant="outline"
                className="flex-1 py-4"
              >
                Zrušit
              </Button>
              <Button
                onClick={handleGuessSubmit}
                className="flex-1 py-4 bg-primary"
                disabled={!guessInput.trim()}
              >
                Hádat
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Player selector */}
      <footer className="bg-card/60 backdrop-blur-lg border-t border-border/50 p-4 sticky bottom-0">
        <div className="flex justify-center gap-2 max-w-lg mx-auto">
          {gameState?.players?.map((player, idx) => (
            <Button
              key={player.id}
              variant={gameState.currentPlayer === idx ? "default" : "outline"}
              size="sm"
              onClick={() => handleCommand({ type: 'SET_PLAYER', playerId: idx })}
              style={{
                backgroundColor: gameState.currentPlayer === idx ? player.color : 'transparent',
                borderColor: player.color,
                color: gameState.currentPlayer === idx ? '#fff' : player.color
              }}
              className="flex-1 max-w-24"
            >
              {player.name?.split(' ')[0] || `H${idx + 1}`}
            </Button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default RemoteController;
