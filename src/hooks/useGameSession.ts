import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateSessionCode, normalizeSessionCode } from '@/utils/sessionCode';
import type { GameState, Player, Puzzle } from '@/types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface GameSessionState {
  currentPlayer: number;
  players: Player[];
  puzzle: Puzzle | null;
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

interface UseGameSessionReturn {
  session: GameSession | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  createSession: (initialState?: Partial<GameSessionState>) => Promise<string | null>;
  joinSession: (code: string) => Promise<boolean>;
  updateGameState: (state: Partial<GameSessionState>) => Promise<void>;
  sendCommand: (command: GameCommand) => Promise<void>;
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

export const useGameSession = (sessionCode?: string): UseGameSessionReturn => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hostIdRef = useRef<string | null>(null);

  // Generate a unique host ID for this browser session
  useEffect(() => {
    let hostId = localStorage.getItem('game_host_id');
    if (!hostId) {
      hostId = crypto.randomUUID();
      localStorage.setItem('game_host_id', hostId);
    }
    hostIdRef.current = hostId;
  }, []);

  // Subscribe to realtime updates
  const subscribeToSession = useCallback((sessionId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
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

      const { data, error: insertError } = await supabase
        .from('game_sessions')
        .insert({
          session_code: code,
          game_state: gameState as any,
          game_mode: gameState.gameMode,
          host_id: hostIdRef.current,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
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
  }, [subscribeToSession]);

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
      setIsHost(data.host_id === hostIdRef.current);
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
  }, [subscribeToSession]);

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
    } catch (err) {
      console.error('Error updating game state:', err);
    }
  }, [session]);

  const sendCommand = useCallback(async (command: GameCommand): Promise<void> => {
    if (!session) {
      console.error('No active session');
      return;
    }

    // Commands are processed by updating the game state with a command marker
    // The host will pick up these commands and execute them
    try {
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ 
          game_state: {
            ...session.game_state,
            _pendingCommand: command,
            _commandTimestamp: Date.now()
          } as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) throw updateError;
      console.log('Command sent:', command);
    } catch (err) {
      console.error('Error sending command:', err);
    }
  }, [session]);

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
    } catch (err) {
      console.error('Error ending session:', err);
    }
  }, [session]);

  return {
    session,
    isHost,
    isLoading,
    error,
    createSession,
    joinSession,
    updateGameState,
    sendCommand,
    endSession
  };
};
