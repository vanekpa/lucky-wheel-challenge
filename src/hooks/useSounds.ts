import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSounds = () => {
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSetting = async () => {
      // First check localStorage (for non-admin overrides)
      const localSetting = localStorage.getItem('sounds_enabled');
      
      const { data } = await supabase
        .from('game_settings')
        .select('setting_value')
        .eq('setting_key', 'sounds_enabled')
        .single();
      
      // localStorage takes priority, then database, default to true
      const enabled = localSetting !== null 
        ? localSetting === 'true' 
        : data?.setting_value !== 'false';
      
      setSoundsEnabled(enabled);
      setSoundsEnabledGlobal(enabled); // Sync global state
      setSoundsLoadingComplete(); // Mark loading as complete
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
          if (payload.new?.setting_value !== undefined) {
            const enabled = payload.new.setting_value === 'true';
            setSoundsEnabled(enabled);
            setSoundsEnabledGlobal(enabled); // Sync global state
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
// Initialize from localStorage immediately to prevent race condition
const initFromLocalStorage = (): boolean => {
  if (typeof window === 'undefined') return true;
  const localSetting = localStorage.getItem('sounds_enabled');
  return localSetting !== null ? localSetting === 'true' : true;
};

let globalSoundsEnabled = initFromLocalStorage();
let globalSoundsLoading = true;

export const setSoundsEnabledGlobal = (enabled: boolean) => {
  globalSoundsEnabled = enabled;
};

export const setSoundsLoadingComplete = () => {
  globalSoundsLoading = false;
};

export const getSoundsEnabled = (): boolean => {
  // During loading, use localStorage value to prevent race condition
  if (globalSoundsLoading) {
    return initFromLocalStorage();
  }
  return globalSoundsEnabled;
};
