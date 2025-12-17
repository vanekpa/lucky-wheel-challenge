import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSession, type GameCommand } from '@/hooks/useGameSession';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, RotateCcw, MessageSquare, SkipForward, Undo2, Target, Sparkles, Trophy, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { wheelSegments } from '@/data/puzzles';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Vibration patterns for different actions
const vibrate = {
  success: () => navigator.vibrate?.([50, 30, 50]),
  error: () => navigator.vibrate?.([100, 50, 100, 50, 100]),
  spin: () => navigator.vibrate?.([100]),
  letter: () => navigator.vibrate?.([30]),
  tap: () => navigator.vibrate?.([20])
};

const RemoteController = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error, sendCommand, joinSession } = useGameSession();
  const [guessInput, setGuessInput] = useState('');
  const [showGuessInput, setShowGuessInput] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    if (code && !session) {
      joinSession(code);
    }
  }, [code]);

  const handleCommand = async (command: GameCommand) => {
    vibrate.tap();
    await sendCommand(command);
    setLastAction('Příkaz odeslán');
    toast.success('Příkaz odeslán', { duration: 1500 });
  };

  const handleSpinCommand = async () => {
    vibrate.spin();
    await sendCommand({ type: 'SPIN_WHEEL' });
    setLastAction('Kolo se točí...');
    toast.success('Zatáčíte kolem!', { duration: 1500 });
  };

  const handleLetterSelect = async (letter: string) => {
    vibrate.letter();
    await sendCommand({ type: 'SELECT_LETTER', letter });
    setLastAction(`Písmeno "${letter}"`);
    toast.success(`Písmeno "${letter}" odesláno`, { duration: 1500 });
  };

  const handleGuessSubmit = async () => {
    if (guessInput.trim()) {
      vibrate.success();
      await sendCommand({ type: 'GUESS_PHRASE', phrase: guessInput.trim() });
      setGuessInput('');
      setShowGuessInput(false);
      setLastAction('Hádání odesláno');
      toast.success('Hádání odesláno');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-slate-400 text-lg">Připojování ke hře...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <p className="text-destructive mb-6 text-lg">{error || 'Session nenalezena'}</p>
          <Button 
            onClick={() => navigate('/join')}
            className="bg-primary hover:bg-primary/90 px-8"
          >
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
  const canSpin = !isSpinning && !isPlacingTokens;

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

  // Calculate progress
  const getProgress = () => {
    if (!gameState?.puzzle) return 0;
    const phrase = gameState.puzzle.phrase || '';
    const revealed = gameState.puzzle.revealedLetters || [];
    const letters = phrase.split('').filter(c => /[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/i.test(c));
    if (letters.length === 0) return 0;
    return Math.round((revealed.length / letters.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: `${currentPlayer?.color || '#6366f1'}15` }}
        />
        <div 
          className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000"
          style={{ backgroundColor: `${currentPlayer?.color || '#6366f1'}10` }}
        />
      </div>

      {/* Header - Glassmorphism */}
      <header className="bg-slate-800/60 backdrop-blur-2xl border-b border-slate-700/50 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center flex-1 mx-4">
            {/* Connection status and session code */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5">
                <Wifi className="w-3 h-3" />
                <span className="text-[10px] font-medium">Připojeno</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                {code}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-lg animate-pulse"
                style={{ 
                  backgroundColor: currentPlayer?.color,
                  boxShadow: `0 0 12px ${currentPlayer?.color}`
                }}
              />
              <p className="font-bold text-white text-lg">
                {currentPlayer?.name || 'Hráč'}
              </p>
            </div>
          </div>

          <div className="text-right bg-slate-700/30 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-xl text-white">{currentPlayer?.score || 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Puzzle Preview Card */}
        {gameState?.puzzle && (
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-slate-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">
                {gameState.puzzle.category}
              </span>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-slate-400">{getProgress()}%</span>
              </div>
            </div>
            <p className="font-mono text-xl tracking-[0.2em] text-white leading-relaxed break-all text-center">
              {getPuzzleHint()}
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        )}

        {/* Token placement mode */}
        {isPlacingTokens && (
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-4 mb-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-white text-lg">Umístěte žeton</p>
                <p className="text-sm text-slate-400">Vyberte segment na kole</p>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {wheelSegments.map((segment, idx) => (
                <Button
                  key={idx}
                  onClick={() => {
                    handleCommand({ type: 'PLACE_TOKEN', playerId: gameState?.currentPlayer || 0, segmentIndex: idx });
                  }}
                  variant="outline"
                  size="sm"
                  className="aspect-square text-xs font-bold p-0 rounded-lg transition-all hover:scale-110 active:scale-95"
                  style={{ 
                    borderColor: segment.color,
                    backgroundColor: `${segment.color}30`,
                    color: '#fff'
                  }}
                >
                  {idx + 1}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main actions */}
        {!showGuessInput && (
          <div className="space-y-4">
            {/* MEGA Spin Button */}
            <button
              onClick={handleSpinCommand}
              disabled={!canSpin}
              className={cn(
                "w-full relative group transition-all duration-300",
                canSpin ? "active:scale-95" : "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "absolute inset-0 rounded-2xl transition-all duration-300",
                canSpin && "bg-primary/30 blur-xl group-hover:bg-primary/50 group-hover:blur-2xl"
              )} />
              <div className={cn(
                "relative bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl py-6 px-8 flex items-center justify-center gap-4 shadow-2xl",
                canSpin && "group-hover:shadow-primary/30"
              )}>
                <RotateCcw className={cn(
                  "w-8 h-8 text-white transition-transform",
                  isSpinning && "animate-spin"
                )} />
                <span className="text-2xl font-bold text-white tracking-wide">
                  {isSpinning ? 'TOČÍ SE...' : 'ZATOČIT'}
                </span>
              </div>
            </button>

            {/* Secondary actions */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShowGuessInput(true)}
                disabled={isSpinning || isPlacingTokens}
                className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl py-4 px-3 flex flex-col items-center gap-2 transition-all hover:bg-slate-700/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-white">Tajenka</span>
              </button>
              <button
                onClick={() => handleCommand({ type: 'NEXT_PLAYER' })}
                disabled={isSpinning}
                className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl py-4 px-3 flex flex-col items-center gap-2 transition-all hover:bg-slate-700/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward className="w-5 h-5 text-orange-400" />
                <span className="text-xs font-medium text-white">Další</span>
              </button>
              <button
                onClick={() => handleCommand({ type: 'UNDO' })}
                disabled={isSpinning}
                className="bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-xl py-4 px-3 flex flex-col items-center gap-2 transition-all hover:bg-slate-700/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-medium text-white">Zpět</span>
              </button>
            </div>

            {/* Letter keyboard */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/30">
              <p className="text-xs text-slate-400 text-center mb-3 font-medium">
                Vyberte písmeno
              </p>
              <div className="grid grid-cols-7 gap-2.5 justify-items-center max-w-sm mx-auto">
                {LETTERS.map(letter => (
                  <button
                    key={letter}
                    onClick={() => handleLetterSelect(letter)}
                    disabled={isSpinning || isPlacingTokens}
                    className={cn(
                      "w-11 h-11 rounded-xl text-lg font-bold transition-all flex items-center justify-center",
                      "bg-slate-700/50 border border-slate-600/50 text-white",
                      "hover:bg-primary hover:border-primary hover:shadow-lg hover:shadow-primary/30",
                      "active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Guess input overlay */}
        {showGuessInput && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <p className="text-2xl font-bold text-white">Hádat tajenku</p>
              <p className="text-slate-400 mt-1">{gameState?.puzzle?.category}</p>
            </div>
            <textarea
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value.toUpperCase())}
              placeholder="Napište celou tajenku..."
              className="w-full p-4 rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 text-lg font-mono resize-none text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={3}
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                onClick={() => setShowGuessInput(false)}
                variant="outline"
                className="flex-1 py-6 rounded-xl bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
              >
                Zrušit
              </Button>
              <Button
                onClick={handleGuessSubmit}
                className="flex-1 py-6 rounded-xl bg-primary hover:bg-primary/90"
                disabled={!guessInput.trim()}
              >
                Hádat
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Player selector footer */}
      <footer className="bg-slate-800/60 backdrop-blur-2xl border-t border-slate-700/50 p-4 sticky bottom-0">
        <div className="flex justify-center gap-2 max-w-lg mx-auto">
          {gameState?.players?.map((player, idx) => (
            <button
              key={player.id}
              onClick={() => {
                vibrate.tap();
                handleCommand({ type: 'SET_PLAYER', playerId: idx });
              }}
              className={cn(
                "flex-1 max-w-28 py-2 px-3 rounded-xl font-medium transition-all flex flex-col items-center",
                gameState.currentPlayer === idx
                  ? "shadow-lg scale-105 ring-2 ring-white/30"
                  : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50"
              )}
              style={{
                backgroundColor: gameState.currentPlayer === idx ? player.color : undefined,
                boxShadow: gameState.currentPlayer === idx ? `0 4px 20px ${player.color}50` : undefined,
                borderColor: gameState.currentPlayer !== idx ? player.color : undefined,
                color: gameState.currentPlayer === idx ? '#fff' : player.color
              }}
            >
              <span className="text-sm font-bold truncate w-full text-center">
                {player.name?.split(' ')[0] || `H${idx + 1}`}
              </span>
              <span className={cn(
                "text-xs font-mono mt-0.5",
                gameState.currentPlayer === idx ? "text-white/80" : "text-slate-400"
              )}>
                {player.score}
              </span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default RemoteController;