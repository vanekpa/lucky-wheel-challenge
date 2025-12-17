import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateSessionCode, normalizeSessionCode } from '@/utils/sessionCode';
import type { GameState, Player, Puzzle } from '@/types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface GameSessionState {
  currentPlayer: number;
  players: Player[];
  puzzle: {
    id: string;
    phrase: string;
    category: string;
    revealedLetters: string[];
  } | null;
  usedLetters: string[];
  round: number;
  isSpinning: boolean;
  wheelResult: any;
  showLetterSelector: boolean;
  isPlacingTokens: boolean;
  tokenPositions: Record<number, number>;
  gameHistory: any[];
  gameMode: 'random' | 'teacher';
  teacherPuzzles: { phrase: string; category: string }[];
  vowelsForceUnlocked?: boolean;
  isGuessingPhrase?: boolean;
  _pendingCommand?: GameCommand;
  _commandTimestamp?: number;
  _hostHeartbeat?: number;
  _lastCommandResult?: { type: 'success' | 'error'; message: string; timestamp: number };
}

export interface GameSession {
  id: string;
  session_code: string;
  game_state: GameSessionState;
  game_mode: string;
  host_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface UseGameSessionReturn {
  session: GameSession | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  lastSyncTime: Date | null;
  createSession: (initialState?: Partial<GameSessionState>) => Promise<string | null>;
  joinSession: (code: string) => Promise<boolean>;
  updateGameState: (state: Partial<GameSessionState>) => Promise<void>;
  sendCommand: (command: GameCommand) => Promise<{ success: boolean; error?: string }>;
  endSession: () => Promise<void>;
}

export type GameCommand = 
  | { type: 'SPIN_WHEEL' }
  | { type: 'SELECT_LETTER'; letter: string }
  | { type: 'PLACE_TOKEN'; playerId: number; segmentIndex?: number }
  | { type: 'GUESS_PHRASE'; phrase: string }
  | { type: 'NEXT_PLAYER' }
  | { type: 'UNDO' }
  | { type: 'SET_PLAYER'; playerId: number }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_EFFECTS' };

const defaultGameState: GameSessionState = {
  currentPlayer: 0,
  players: [],
  puzzle: null,
  usedLetters: [],
  round: 1,
  isSpinning: false,
  wheelResult: null,
  showLetterSelector: false,
  isPlacingTokens: false,
  tokenPositions: {},
  gameHistory: [],
  gameMode: 'random',
  teacherPuzzles: []
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

export const useGameSession = (sessionCode?: string): UseGameSessionReturn => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hostIdRef = useRef<string | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a unique host ID for this browser session - synchronously
  const getHostId = useCallback(() => {
    if (hostIdRef.current) return hostIdRef.current;
    
    let hostId = localStorage.getItem('game_host_id');
    if (!hostId) {
      hostId = crypto.randomUUID();
      localStorage.setItem('game_host_id', hostId);
    }
    hostIdRef.current = hostId;
    return hostId;
  }, []);

  // Retry wrapper for commands
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const data = await operation();
        return { success: true, data };
      } catch (err) {
        lastError = err as Error;
        console.warn(`Attempt ${attempt + 1} failed:`, err);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        }
      }
    }
    
    return { success: false, error: lastError?.message || 'Unknown error' };
  }, []);

  // Subscribe to realtime updates with auto-reconnect
  const subscribeToSession = useCallback((sessionId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    setConnectionStatus('connecting');

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Session updated:', payload);
          const newSession = payload.new as any;
          setSession({
            ...newSession,
            game_state: newSession.game_state as GameSessionState
          });
          setLastSyncTime(new Date());
          setConnectionStatus('connected');
          reconnectAttemptRef.current = 0;
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          reconnectAttemptRef.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('error');
          // Auto-reconnect with exponential backoff
          const attemptReconnect = () => {
            if (reconnectAttemptRef.current < RECONNECT_DELAYS.length) {
              const delay = RECONNECT_DELAYS[reconnectAttemptRef.current];
              console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectAttemptRef.current++;
                subscribeToSession(sessionId);
              }, delay);
            } else {
              setConnectionStatus('disconnected');
              setError('Spojení bylo ztraceno. Obnovte stránku.');
            }
          };
          attemptReconnect();
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    channelRef.current = channel;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Auto-join if sessionCode is provided
  useEffect(() => {
    if (sessionCode) {
      joinSession(sessionCode);
    }
  }, [sessionCode]);

  const createSession = useCallback(async (initialState?: Partial<GameSessionState>): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const code = generateSessionCode();
      const gameState = { ...defaultGameState, ...initialState };

      console.log('Creating session with code:', code);
      console.log('Host ID:', getHostId());
      
      const { data, error: insertError } = await supabase
        .from('game_sessions')
        .insert({
          session_code: code,
          game_state: gameState as any,
          game_mode: gameState.gameMode,
          host_id: getHostId(),
          is_active: true
        })
        .select()
        .single();

      console.log('Insert result:', { data, insertError });

      if (insertError) {
        console.error('Insert error details:', insertError);
        // If code already exists, try again
        if (insertError.code === '23505') {
          return createSession(initialState);
        }
        throw insertError;
      }

      const newSession = {
        ...data,
        game_state: data.game_state as unknown as GameSessionState
      };

      setSession(newSession as GameSession);
      setIsHost(true);
      setLastSyncTime(new Date());
      subscribeToSession(data.id);

      console.log('Session created:', code);
      return code;
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Nepodařilo se vytvořit session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [subscribeToSession, getHostId]);

  const joinSession = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const normalizedCode = normalizeSessionCode(code);

      const { data, error: fetchError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('session_code', normalizedCode)
        .eq('is_active', true)
        .single();

      if (fetchError || !data) {
        setError('Session nenalezena nebo již není aktivní');
        return false;
      }

      const joinedSession = {
        ...data,
        game_state: data.game_state as unknown as GameSessionState
      };

      setSession(joinedSession as GameSession);
      setIsHost(data.host_id === getHostId());
      setLastSyncTime(new Date());
      subscribeToSession(data.id);

      console.log('Joined session:', normalizedCode);
      return true;
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Nepodařilo se připojit k session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscribeToSession, getHostId]);

  const updateGameState = useCallback(async (stateUpdate: Partial<GameSessionState>): Promise<void> => {
    if (!session) {
      console.error('No active session');
      return;
    }

    try {
      const newState = { ...session.game_state, ...stateUpdate };

      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ 
          game_state: newState as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) throw updateError;

      // Optimistic update
      setSession(prev => prev ? { ...prev, game_state: newState } : null);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error updating game state:', err);
    }
  }, [session]);

  const sendCommand = useCallback(async (command: GameCommand): Promise<{ success: boolean; error?: string }> => {
    if (!session) {
      console.error('No active session');
      return { success: false, error: 'Žádná aktivní session' };
    }

    const result = await withRetry(async () => {
      // First fetch the current state to avoid race conditions
      const { data: currentSession, error: fetchError } = await supabase
        .from('game_sessions')
        .select('game_state')
        .eq('id', session.id)
        .single();

      if (fetchError) throw fetchError;

      const currentState = (currentSession?.game_state || {}) as unknown as Partial<GameSessionState>;
      
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ 
          game_state: {
            ...currentState,
            _pendingCommand: command,
            _commandTimestamp: Date.now()
          } as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) throw updateError;
      console.log('Command sent:', command);
      return true;
    });

    if (result.success) {
      setLastSyncTime(new Date());
    }

    return { success: result.success, error: result.error };
  }, [session, withRetry]);

  const endSession = useCallback(async (): Promise<void> => {
    if (!session) return;

    try {
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ is_active: false })
        .eq('id', session.id);

      if (updateError) throw updateError;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      setSession(null);
      setIsHost(false);
      setConnectionStatus('disconnected');
    } catch (err) {
      console.error('Error ending session:', err);
    }
  }, [session]);

  return {
    session,
    isHost,
    isLoading,
    error,
    connectionStatus,
    lastSyncTime,
    createSession,
    joinSession,
    updateGameState,
    sendCommand,
    endSession
  };
};
