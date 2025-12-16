import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSounds = () => {
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from('game_settings')
        .select('setting_value')
        .eq('setting_key', 'sounds_enabled')
        .single();
      
      if (data) {
        setSoundsEnabled(data.setting_value === 'true');
      }
      setLoading(false);
    };

    fetchSetting();

    // Real-time subscription
    const channel = supabase
      .channel('sounds-settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_settings',
          filter: 'setting_key=eq.sounds_enabled'
        },
        (payload: any) => {
          if (payload.new?.setting_value) {
            setSoundsEnabled(payload.new.setting_value === 'true');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { soundsEnabled, loading };
};

// Global sound state for use in sound functions
let globalSoundsEnabled = true;

export const setSoundsEnabledGlobal = (enabled: boolean) => {
  globalSoundsEnabled = enabled;
};

export const getSoundsEnabled = () => globalSoundsEnabled;
