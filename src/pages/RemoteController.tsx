import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSession, type GameCommand } from '@/hooks/useGameSession';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, RotateCcw, MessageSquare, SkipForward, Undo2, Target, Wifi, WifiOff, Shuffle, Lock, Unlock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { wheelSegments } from '@/data/puzzles';
import { supabase } from '@/integrations/supabase/client';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
const MIN_SCORE_FOR_VOWELS = 1000;
const POLL_INTERVAL_MS = 3000;

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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (code && !session) {
      joinSession(code);
    }
  }, [code]);

  // Update lastUpdate when session changes
  useEffect(() => {
    if (session) {
      setLastUpdate(new Date());
    }
  }, [session?.game_state]);

  // Polling fallback - refetch session every 3 seconds
  useEffect(() => {
    if (!session?.id) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('game_sessions')
          .select('game_state, updated_at')
          .eq('id', session.id)
          .single();
        
        if (data && !fetchError) {
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollInterval);
  }, [session?.id]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    if (!code || isRefreshing) return;
    setIsRefreshing(true);
    vibrate.tap();
    
    try {
      await joinSession(code);
      setLastUpdate(new Date());
      toast.success('Synchronizováno', { duration: 1000 });
    } catch (err) {
      toast.error('Chyba synchronizace');
    } finally {
      setIsRefreshing(false);
    }
  }, [code, isRefreshing, joinSession]);

  // Format last update time
  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    if (diff < 5) return 'právě teď';
    if (diff < 60) return `před ${diff}s`;
    return `před ${Math.floor(diff / 60)}m`;
  };

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
  const showLetterSelector = gameState?.showLetterSelector;
  const canSpin = !isSpinning && !isPlacingTokens && !showLetterSelector;
  const playerColor = currentPlayer?.color || '#6366f1';
  const playerScore = currentPlayer?.score || 0;
  const vowelsForceUnlocked = gameState?.vowelsForceUnlocked || false;
  const vowelsUnlocked = vowelsForceUnlocked || playerScore >= MIN_SCORE_FOR_VOWELS;

  // Determine current action state
  const getActionState = () => {
    if (isPlacingTokens) return { text: '🎯 Umístěte žeton', color: 'bg-primary/20 text-primary border-primary/40' };
    if (isSpinning) return { text: '🎡 Kolo se točí...', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    if (showLetterSelector) return { text: '🔤 Vyberte písmeno!', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    return { text: '▶️ Můžete zatočit', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };
  };

  const actionState = getActionState();

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
          {/* Sync indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>{formatLastUpdate()}</span>
          </div>
          
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-md hover:bg-slate-700/50 active:scale-90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-400", isRefreshing && "animate-spin")} />
          </button>
          
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ backgroundColor: `${playerColor}30`, border: `2px solid ${playerColor}` }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: playerColor }} />
            <span className="font-bold text-sm" style={{ color: playerColor }}>{currentPlayer?.name || 'Hráč'}</span>
          </div>
        </div>

        <div className="font-bold text-lg text-white">{playerScore}</div>
      </header>

      {/* Action State Banner */}
      <div className={cn("px-3 py-2 text-center text-sm font-medium border-b", actionState.color)}>
        {actionState.text}
      </div>

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

        {/* Vowel status indicator */}
        <div className={cn(
          "flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
          vowelsUnlocked 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        )}>
          {vowelsUnlocked ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>{vowelsForceUnlocked ? "Samohlásky odemčeny (deadlock)" : "Samohlásky odemčeny"}</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Samohlásky: ještě {MIN_SCORE_FOR_VOWELS - playerScore} bodů</span>
            </>
          )}
        </div>

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
            {LETTERS.map(letter => {
              const isVowel = VOWELS.has(letter);
              const isLocked = isVowel && !vowelsUnlocked;
              return (
                <button
                  key={letter}
                  onClick={() => handleLetterSelect(letter)}
                  disabled={isSpinning || isPlacingTokens || !showLetterSelector}
                  className={cn(
                    "aspect-square rounded-lg text-base font-bold transition-all flex items-center justify-center relative overflow-hidden",
                    "border text-white",
                    isLocked 
                      ? "bg-gradient-to-br from-red-900/70 to-red-800/50 border-red-600/70" 
                      : "bg-slate-700/60 border-slate-600/40",
                    showLetterSelector && !isLocked && "active:scale-90 active:bg-primary",
                    !showLetterSelector && "opacity-30"
                  )}
                >
                  {/* Red overlay for locked vowels */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-red-300 drop-shadow-lg" />
                    </div>
                  )}
                  <span className={cn(isLocked && "opacity-40")}>{letter}</span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RemoteController;
