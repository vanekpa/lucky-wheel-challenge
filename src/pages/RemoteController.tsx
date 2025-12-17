import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSession, type GameCommand } from '@/hooks/useGameSession';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, RotateCcw, MessageSquare, SkipForward, Undo2, Target, Wifi, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { wheelSegments } from '@/data/puzzles';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Vibration patterns
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

  useEffect(() => {
    if (code && !session) {
      joinSession(code);
    }
  }, [code]);

  const handleCommand = async (command: GameCommand) => {
    vibrate.tap();
    await sendCommand(command);
  };

  const handleSpinCommand = async () => {
    vibrate.spin();
    await sendCommand({ type: 'SPIN_WHEEL' });
  };

  const handleLetterSelect = async (letter: string) => {
    vibrate.letter();
    await sendCommand({ type: 'SELECT_LETTER', letter });
    toast.success(`"${letter}"`, { duration: 1000 });
  };

  const handleGuessSubmit = async () => {
    if (guessInput.trim()) {
      vibrate.success();
      await sendCommand({ type: 'GUESS_PHRASE', phrase: guessInput.trim() });
      setGuessInput('');
      setShowGuessInput(false);
      toast.success('Odesláno');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-6 text-center max-w-xs">
          <p className="text-destructive mb-4">{error || 'Session nenalezena'}</p>
          <Button onClick={() => navigate('/join')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
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
  const playerColor = currentPlayer?.color || '#6366f1';

  // Guess input view
  if (showGuessInput) {
    return (
      <div 
        className="h-screen flex flex-col p-4"
        style={{ background: `linear-gradient(180deg, ${playerColor}20 0%, #0f172a 100%)` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setShowGuessInput(false)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-medium">Hádat tajenku</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-center gap-4 max-w-sm mx-auto w-full">
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Napište celou tajenku..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-lg"
            autoFocus
          />
          <Button onClick={handleGuessSubmit} className="py-6 text-lg" style={{ backgroundColor: playerColor }}>
            Odeslat tip
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${playerColor}15 0%, #0f172a 50%)` }}
    >
      {/* Compact Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50" style={{ backgroundColor: `${playerColor}10` }}>
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ backgroundColor: `${playerColor}30`, border: `2px solid ${playerColor}` }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: playerColor }} />
            <span className="font-bold text-sm" style={{ color: playerColor }}>{currentPlayer?.name || 'Hráč'}</span>
          </div>
        </div>

        <div className="font-bold text-lg text-white">{currentPlayer?.score || 0}</div>
      </header>

      {/* Main Content - No scroll */}
      <main className="flex-1 flex flex-col p-3 gap-2 overflow-hidden">
        
        {/* Token placement - compact */}
        {isPlacingTokens && (
          <div className="bg-slate-800/60 rounded-xl p-3 border border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-white">Umístěte žeton</span>
              </div>
              <button
                onClick={() => {
                  vibrate.success();
                  const randomIdx = Math.floor(Math.random() * 32);
                  handleCommand({ type: 'PLACE_TOKEN', playerId: gameState?.currentPlayer || 0, segmentIndex: randomIdx });
                }}
                className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                <Shuffle className="w-3 h-3" />
                Náhodně
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {wheelSegments.map((segment, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCommand({ type: 'PLACE_TOKEN', playerId: gameState?.currentPlayer || 0, segmentIndex: idx })}
                  className="aspect-square text-[10px] font-bold rounded transition-all active:scale-90"
                  style={{ backgroundColor: `${segment.color}40`, border: `1px solid ${segment.color}`, color: '#fff' }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SPIN Button - Big but not huge */}
        <button
          onClick={handleSpinCommand}
          disabled={!canSpin}
          className={cn(
            "rounded-2xl py-5 flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
            !canSpin && "opacity-50"
          )}
          style={{ 
            background: canSpin ? `linear-gradient(135deg, ${playerColor} 0%, ${playerColor}bb 100%)` : '#475569',
            boxShadow: canSpin ? `0 8px 30px ${playerColor}40` : undefined
          }}
        >
          <RotateCcw className={cn("w-8 h-8 text-white", isSpinning && "animate-spin")} />
          <span className="text-2xl font-black text-white">{isSpinning ? 'TOČÍ SE...' : 'ZATOČIT'}</span>
          <span className="text-sm text-white/70">{currentPlayer?.name}</span>
        </button>

        {/* Quick actions row */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowGuessInput(true)}
            disabled={isSpinning || isPlacingTokens}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
          >
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-white">Tajenka</span>
          </button>
          <button
            onClick={() => handleCommand({ type: 'NEXT_PLAYER' })}
            disabled={isSpinning}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
          >
            <SkipForward className="w-5 h-5 text-orange-400" />
            <span className="text-[10px] font-medium text-white">Další</span>
          </button>
          <button
            onClick={() => handleCommand({ type: 'UNDO' })}
            disabled={isSpinning}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
          >
            <Undo2 className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] font-medium text-white">Zpět</span>
          </button>
        </div>

        {/* Compact Letter Keyboard - fills remaining space */}
        <div className="flex-1 bg-slate-800/30 rounded-xl p-2 flex flex-col min-h-0">
          <p className="text-[10px] text-slate-500 text-center mb-1">Vyberte písmeno</p>
          <div className="flex-1 grid grid-cols-7 gap-1 content-center">
            {LETTERS.map(letter => (
              <button
                key={letter}
                onClick={() => handleLetterSelect(letter)}
                disabled={isSpinning || isPlacingTokens}
                className={cn(
                  "aspect-square rounded-lg text-base font-bold transition-all flex items-center justify-center",
                  "bg-slate-700/60 border border-slate-600/40 text-white",
                  "active:scale-90 active:bg-primary disabled:opacity-30"
                )}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RemoteController;
