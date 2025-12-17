import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTurnTimer = () => {
  const [turnTimer, setTurnTimer] = useState(0); // 0 = disabled
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from('game_settings')
        .select('setting_value')
        .eq('setting_key', 'turn_timer')
        .single();
      
      if (data) {
        setTurnTimer(parseInt(data.setting_value) || 0);
      }
      setLoading(false);
    };

    fetchSetting();

    // Real-time subscription
    const channel = supabase
      .channel('turn-timer-settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_settings',
          filter: 'setting_key=eq.turn_timer'
        },
        (payload: any) => {
          if (payload.new?.setting_value) {
            setTurnTimer(parseInt(payload.new.setting_value) || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateTurnTimer = async (value: number) => {
    setTurnTimer(value);
    // Save to localStorage for non-admin users
    localStorage.setItem('turn_timer', value.toString());
  };

  return { turnTimer, setTurnTimer: updateTurnTimer, loading };
};
