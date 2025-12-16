import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useGameSettings = () => {
  const [updating, setUpdating] = useState(false);

  const updateSetting = async (key: string, value: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('game_settings')
      .update({ setting_value: value, updated_at: new Date().toISOString() })
      .eq('setting_key', key);

    if (error) {
      console.error('Error updating setting:', error);
      toast.error('Chyba při ukládání nastavení');
    } else {
      toast.success('Nastavení uloženo');
    }
    setUpdating(false);
  };

  return {
    updateSetting,
    updating,
  };
};
