import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSession, type GameCommand, type ConnectionStatus } from '@/hooks/useGameSession';
import { Button } from '@/components/ui/button';
import { SpinButton } from '@/components/game/SpinButton';
import { ArrowLeft, Loader2, MessageSquare, SkipForward, Undo2, Target, Wifi, WifiOff, Shuffle, RefreshCw, AlertTriangle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { wheelSegments } from '@/data/puzzles';
import { supabase } from '@/integrations/supabase/client';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
const MIN_SCORE_FOR_VOWELS = 1000;
const POLL_INTERVAL_MS = 10000; // Reduced from 3s to 10s - only fallback for realtime
const HOST_TIMEOUT_MS = 10000; // Host is considered offline after 10s
const SESSION_WARNING_MS = 55 * 60 * 1000; // Warn 5min before 60min expiry

// Vibration patterns
const vibrate = {
  success: () => navigator.vibrate?.([50, 30, 50]),
  error: () => navigator.vibrate?.([100, 50, 100, 50, 100]),
  spin: () => navigator.vibrate?.([100]),
  letter: () => navigator.vibrate?.([30]),
  tap: () => navigator.vibrate?.([20]),
  bankrot: () => navigator.vibrate?.([200, 100, 200, 100, 200]),
  nic: () => navigator.vibrate?.([150, 50, 150])
};

const RemoteController = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error, sendCommand, joinSession, connectionStatus, lastSyncTime } = useGameSession();
  
  // UI State
  const [guessInput, setGuessInput] = useState('');
  const [showGuessInput, setShowGuessInput] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Optimistic UI state
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Host status
  const [hostOnline, setHostOnline] = useState(true);
  
  // Session expiry warning
  const [sessionWarning, setSessionWarning] = useState(false);
  
  // Track last command result
  const lastResultTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (code && !session) {
      joinSession(code);
    }
  }, [code]);

  // Check host heartbeat
  useEffect(() => {
    if (!session?.game_state?._hostHeartbeat) return;
    
    const checkHostStatus = () => {
      const lastHeartbeat = session.game_state._hostHeartbeat || 0;
      const now = Date.now();
      setHostOnline(now - lastHeartbeat < HOST_TIMEOUT_MS);
    };
    
    checkHostStatus();
    const interval = setInterval(checkHostStatus, 2000);
    return () => clearInterval(interval);
  }, [session?.game_state?._hostHeartbeat]);

  // Check session expiry
  useEffect(() => {
    if (!session?.created_at) return;
    
    const checkExpiry = () => {
      const createdAt = new Date(session.created_at).getTime();
      const now = Date.now();
      const elapsed = now - createdAt;
      
      if (elapsed > SESSION_WARNING_MS && !sessionWarning) {
        setSessionWarning(true);
        toast.warning('Session vyprší za 5 minut!', { duration: 10000 });
      }
    };
    
    checkExpiry();
    const interval = setInterval(checkExpiry, 30000);
    return () => clearInterval(interval);
  }, [session?.created_at, sessionWarning]);

  // Handle command result feedback from host
  useEffect(() => {
    const result = session?.game_state?._lastCommandResult;
    if (!result || result.timestamp <= lastResultTimestampRef.current) return;
    
    lastResultTimestampRef.current = result.timestamp;
    
    if (result.type === 'success') {
      vibrate.success();
    } else {
      vibrate.error();
    }
    
    setCommandFeedback({ type: result.type, message: result.message });
    setTimeout(() => setCommandFeedback(null), 2000);
  }, [session?.game_state?._lastCommandResult]);

  // Polling fallback - only check heartbeat to detect stale realtime, don't rejoin aggressively
  useEffect(() => {
    if (!session?.id || !code) return;
    
    let lastKnownHeartbeat = session.game_state?._hostHeartbeat || 0;

    const pollInterval = setInterval(async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('game_sessions')
          .select('game_state')
          .eq('id', session.id)
          .single();
        
        if (data && !fetchError && data.game_state) {
          const remoteHeartbeat = (data.game_state as any)?._hostHeartbeat || 0;
          
          // Only rejoin if heartbeat jumped significantly (realtime might be stale)
          if (remoteHeartbeat > lastKnownHeartbeat + 15000) {
            console.log('Heartbeat gap detected, refreshing session...');
            await joinSession(code);
          }
          lastKnownHeartbeat = remoteHeartbeat;
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollInterval);
  }, [session?.id, code, joinSession]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    if (!code || isRefreshing) return;
    setIsRefreshing(true);
    vibrate.tap();
    
    try {
      await joinSession(code);
      toast.success('Synchronizováno', { duration: 1000 });
    } catch (err) {
      toast.error('Chyba synchronizace');
    } finally {
      setIsRefreshing(false);
    }
  }, [code, isRefreshing, joinSession]);

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastSyncTime) return 'neznámý';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);
    if (diff < 5) return 'právě teď';
    if (diff < 60) return `před ${diff}s`;
    return `před ${Math.floor(diff / 60)}m`;
  };

  // Get connection status indicator
  const getConnectionIndicator = (): { color: string; icon: typeof Wifi; pulse: boolean } => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'text-emerald-400', icon: Wifi, pulse: false };
      case 'connecting':
        return { color: 'text-amber-400', icon: Wifi, pulse: true };
      case 'error':
        return { color: 'text-red-400', icon: WifiOff, pulse: true };
      default:
        return { color: 'text-slate-400', icon: WifiOff, pulse: false };
    }
  };

  // Command handlers with optimistic UI
  const handleCommand = async (command: GameCommand, feedbackText?: string) => {
    vibrate.tap();
    setPendingCommand(feedbackText || command.type);
    
    const result = await sendCommand(command);
    
    if (!result.success) {
      vibrate.error();
      setCommandFeedback({ type: 'error', message: result.error || 'Chyba příkazu' });
      setTimeout(() => setCommandFeedback(null), 2000);
    }
    
    setTimeout(() => setPendingCommand(null), 500);
  };

  const handleSpinCommand = async (power: number = 50) => {
    vibrate.spin();
    setPendingCommand('SPIN');
    
    const result = await sendCommand({ type: 'SPIN_WHEEL', power });
    
    if (!result.success) {
      vibrate.error();
      setCommandFeedback({ type: 'error', message: 'Nepodařilo se zatočit' });
      setTimeout(() => setCommandFeedback(null), 2000);
    }
    
    setTimeout(() => setPendingCommand(null), 500);
  };

  const handleLetterSelect = async (letter: string) => {
    vibrate.letter();
    setPendingCommand(`LETTER_${letter}`);
    
    const result = await sendCommand({ type: 'SELECT_LETTER', letter });
    
    if (result.success) {
      toast.success(`"${letter}"`, { duration: 1000 });
    } else {
      vibrate.error();
      setCommandFeedback({ type: 'error', message: 'Chyba odeslání' });
      setTimeout(() => setCommandFeedback(null), 2000);
    }
    
    setTimeout(() => setPendingCommand(null), 500);
  };

  const handleGuessSubmit = async () => {
    if (guessInput.trim()) {
      vibrate.success();
      setPendingCommand('GUESS');
      
      const result = await sendCommand({ type: 'GUESS_PHRASE', phrase: guessInput.trim() });
      
      if (result.success) {
        setGuessInput('');
        setShowGuessInput(false);
        toast.success('Odesláno');
      } else {
        vibrate.error();
        toast.error('Chyba odeslání');
      }
      
      setTimeout(() => setPendingCommand(null), 500);
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
  const isSpinning = gameState?.isSpinning || pendingCommand === 'SPIN';
  const showLetterSelector = gameState?.showLetterSelector;
  const isGuessingPhrase = gameState?.isGuessingPhrase || false;
  const canSpin = !isSpinning && !isPlacingTokens && !showLetterSelector && !isGuessingPhrase && !pendingCommand;
  const playerColor = currentPlayer?.color || '#6366f1';
  const playerScore = currentPlayer?.score || 0;
  const vowelsForceUnlocked = gameState?.vowelsForceUnlocked || false;
  const vowelsUnlocked = vowelsForceUnlocked || playerScore >= MIN_SCORE_FOR_VOWELS;
  
  // Puzzle preview
  const puzzle = gameState?.puzzle;
  const puzzlePreview = puzzle ? {
    phrase: puzzle.phrase,
    revealed: new Set(puzzle.revealedLetters || []),
    category: puzzle.category
  } : null;

  const connectionIndicator = getConnectionIndicator();
  const ConnectionIcon = connectionIndicator.icon;

  // Determine current action state
  const getActionState = () => {
    if (pendingCommand) return { text: '⏳ Odesílám...', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40' };
    if (isPlacingTokens) return { text: '🎯 Umístěte žeton', color: 'bg-primary/20 text-primary border-primary/40' };
    if (isSpinning) return { text: '🎡 Kolo se točí...', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    if (isGuessingPhrase) return { text: '💭 Hádání tajenky...', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
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
        
        {/* Mini puzzle hint */}
        {puzzlePreview && (
          <div className="bg-slate-800/60 rounded-lg p-3 mb-4">
            <p className="text-[10px] text-slate-500 mb-1">Nápověda ({puzzlePreview.category}):</p>
            <p className="text-white font-mono text-sm tracking-wider">
              {puzzlePreview.phrase.split('').map((char, i) => {
                if (char === ' ') return ' ';
                if (!/[A-ZÁ-Ža-zá-ž]/i.test(char)) return char;
                return puzzlePreview.revealed.has(char.toUpperCase()) ? char : '_';
              }).join('')}
            </p>
          </div>
        )}
        
        <div className="flex-1 flex flex-col justify-center gap-4 max-w-sm mx-auto w-full">
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="Napište celou tajenku..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-lg"
            autoFocus
          />
          <Button 
            onClick={handleGuessSubmit} 
            className="py-6 text-lg" 
            style={{ backgroundColor: playerColor }}
            disabled={!!pendingCommand}
          >
            {pendingCommand === 'GUESS' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Odeslat tip'}
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
      {/* Command feedback overlay */}
      {commandFeedback && (
        <div className={cn(
          "absolute inset-0 z-50 flex items-center justify-center pointer-events-none",
          commandFeedback.type === 'success' ? "bg-emerald-500/10" : "bg-red-500/10"
        )}>
          <div className={cn(
            "rounded-full p-4",
            commandFeedback.type === 'success' ? "bg-emerald-500" : "bg-red-500"
          )}>
            {commandFeedback.type === 'success' ? (
              <Check className="w-8 h-8 text-white" />
            ) : (
              <X className="w-8 h-8 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Compact Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50" style={{ backgroundColor: `${playerColor}10` }}>
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Button>
        
        <div className="flex items-center gap-2">
          {/* Host status */}
          {!hostOnline && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              <span>Host offline</span>
            </div>
          )}
          
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <ConnectionIcon className={cn("w-3 h-3", connectionIndicator.color, connectionIndicator.pulse && "animate-pulse")} />
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

      {/* Session expiry warning */}
      {sessionWarning && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-3 py-1.5 text-center">
          <span className="text-[11px] text-amber-400 font-medium">⚠️ Session vyprší brzy!</span>
        </div>
      )}

      {/* Action State Banner */}
      <div className={cn("px-3 py-2 text-center text-sm font-medium border-b", actionState.color)}>
        {actionState.text}
      </div>

      {/* Mini Puzzle Preview */}
      {puzzlePreview && !isPlacingTokens && (
        <div className="px-3 py-2 bg-slate-800/40 border-b border-slate-700/30">
          <p className="text-[9px] text-slate-500 text-center mb-0.5">{puzzlePreview.category}</p>
          <p className="text-white font-mono text-[11px] text-center tracking-wide truncate">
            {puzzlePreview.phrase.split('').map((char, i) => {
              if (char === ' ') return '  ';
              if (!/[A-ZÁ-Ža-zá-ž]/i.test(char)) return char;
              return puzzlePreview.revealed.has(char.toUpperCase()) ? char : '·';
            }).join('')}
          </p>
        </div>
      )}

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
                  // Filter out BANKROT and NIČ segments for random placement
                  const validSegments = wheelSegments
                    .map((seg, idx) => ({ seg, idx }))
                    .filter(({ seg }) => seg.value !== 'BANKROT' && seg.value !== 'NIČ');
                  const randomPick = validSegments[Math.floor(Math.random() * validSegments.length)];
                  handleCommand({ type: 'PLACE_TOKEN', playerId: gameState?.currentPlayer || 0, segmentIndex: randomPick.idx }, 'TOKEN');
                }}
                disabled={!!pendingCommand}
                className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                <Shuffle className="w-3 h-3" />
                Náhodně
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {wheelSegments.map((segment, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCommand({ type: 'PLACE_TOKEN', playerId: gameState?.currentPlayer || 0, segmentIndex: idx }, 'TOKEN')}
                  disabled={!!pendingCommand}
                  className="aspect-square text-[10px] font-bold rounded transition-all active:scale-90 disabled:opacity-50"
                  style={{ backgroundColor: `${segment.color}40`, border: `1px solid ${segment.color}`, color: '#fff' }}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SPIN Button with Power Meter */}
        <SpinButton
          onSpin={handleSpinCommand}
          disabled={!canSpin || !!pendingCommand}
          isSpinning={isSpinning}
          playerName={currentPlayer?.name}
          playerColor={playerColor}
          size="compact"
        />


        {/* Quick actions row */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowGuessInput(true)}
            disabled={isSpinning || isPlacingTokens || !!pendingCommand}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
          >
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-medium text-white">Tajenka</span>
          </button>
          <button
            onClick={() => handleCommand({ type: 'NEXT_PLAYER' }, 'NEXT')}
            disabled={isSpinning || !!pendingCommand}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
          >
            <SkipForward className="w-5 h-5 text-orange-400" />
            <span className="text-[10px] font-medium text-white">Přeskočit</span>
          </button>
          <button
            onClick={() => handleCommand({ type: 'UNDO' }, 'UNDO')}
            disabled={isSpinning || !!pendingCommand}
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
              const isPending = pendingCommand === `LETTER_${letter}`;
              return (
                <button
                  key={letter}
                  onClick={() => handleLetterSelect(letter)}
                  disabled={isSpinning || isPlacingTokens || !showLetterSelector || !!pendingCommand}
                  className={cn(
                    "aspect-square rounded-lg text-base font-bold transition-all flex items-center justify-center relative",
                    "border text-white bg-slate-700/60 border-slate-600/40",
                    showLetterSelector && !pendingCommand && "active:scale-90 active:bg-primary",
                    !showLetterSelector && "opacity-30",
                    isPending && "bg-primary animate-pulse"
                  )}
                >
                  {letter}
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
