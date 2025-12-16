import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type DayTime = 'day' | 'night';

interface SeasonColors {
  gradient: string;
  accent: string;
  particle: string;
}

export const seasonColors: Record<Season, Record<DayTime, SeasonColors>> = {
  winter: {
    day: {
      gradient: 'from-blue-200/40 via-slate-300/40 to-blue-400/40',
      accent: '#00d4ff',
      particle: '#ffffff',
    },
    night: {
      gradient: 'from-blue-950/60 via-indigo-950/60 to-slate-950/60',
      accent: '#4facfe',
      particle: '#e8f4ff',
    },
  },
  spring: {
    day: {
      gradient: 'from-green-300/40 via-pink-200/40 to-blue-300/40',
      accent: '#ff9a9e',
      particle: '#ffb6c1',
    },
    night: {
      gradient: 'from-green-900/50 via-purple-900/50 to-blue-900/50',
      accent: '#a18cd1',
      particle: '#fbc2eb',
    },
  },
  summer: {
    day: {
      gradient: 'from-orange-300/40 via-yellow-200/40 to-blue-300/40',
      accent: '#ffd700',
      particle: '#fffacd',
    },
    night: {
      gradient: 'from-orange-900/50 via-purple-900/50 to-blue-900/50',
      accent: '#fa709a',
      particle: '#fee140',
    },
  },
  autumn: {
    day: {
      gradient: 'from-orange-400/40 via-amber-300/40 to-red-400/40',
      accent: '#ff6b35',
      particle: '#d4621a',
    },
    night: {
      gradient: 'from-orange-950/60 via-amber-950/60 to-red-950/60',
      accent: '#ff9966',
      particle: '#cc5500',
    },
  },
};

const getAutoSeason = (): Season => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

const getAutoDayTime = (): DayTime => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'day' : 'night';
};

export const useSeason = () => {
  const [seasonSetting, setSeasonSetting] = useState<string>('auto');
  const [dayTimeSetting, setDayTimeSetting] = useState<string>('auto');
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('game_settings')
        .select('setting_key, setting_value');

      if (!error && data) {
        data.forEach((setting) => {
          if (setting.setting_key === 'season') {
            setSeasonSetting(setting.setting_value);
          } else if (setting.setting_key === 'day_time') {
            setDayTimeSetting(setting.setting_value);
          } else if (setting.setting_key === 'effects_enabled') {
            setEffectsEnabled(setting.setting_value === 'true');
          }
        });
      }
      setLoading(false);
    };

    fetchSettings();

    // Real-time subscription
    const channel = supabase
      .channel('game_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_settings' },
        (payload) => {
          const newData = payload.new as { setting_key: string; setting_value: string };
          if (newData.setting_key === 'season') {
            setSeasonSetting(newData.setting_value);
          } else if (newData.setting_key === 'day_time') {
            setDayTimeSetting(newData.setting_value);
          } else if (newData.setting_key === 'effects_enabled') {
            setEffectsEnabled(newData.setting_value === 'true');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const season: Season = seasonSetting === 'auto' ? getAutoSeason() : (seasonSetting as Season);
  const dayTime: DayTime = dayTimeSetting === 'auto' ? getAutoDayTime() : (dayTimeSetting as DayTime);
  const colors = seasonColors[season][dayTime];

  return {
    season,
    dayTime,
    effectsEnabled,
    isAutoSeason: seasonSetting === 'auto',
    isAutoDayTime: dayTimeSetting === 'auto',
    colors,
    loading,
  };
};
