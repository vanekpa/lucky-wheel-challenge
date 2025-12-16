import { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useSounds, setSoundsEnabledGlobal } from '@/hooks/useSounds';

interface PlayerSettingsProps {
  effectsEnabled: boolean;
  onEffectsChange: (enabled: boolean) => void;
}

export const PlayerSettings = ({ effectsEnabled, onEffectsChange }: PlayerSettingsProps) => {
  const { soundsEnabled } = useSounds();
  const [localSoundsEnabled, setLocalSoundsEnabled] = useState(soundsEnabled);

  useEffect(() => {
    setLocalSoundsEnabled(soundsEnabled);
  }, [soundsEnabled]);

  const handleSoundsToggle = async (checked: boolean) => {
    setLocalSoundsEnabled(checked);
    setSoundsEnabledGlobal(checked);
    
    // Persist to database
    try {
      await supabase
        .from('game_settings')
        .upsert({ 
          setting_key: 'sounds_enabled', 
          setting_value: checked.toString(),
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'setting_key' 
        });
    } catch (error) {
      console.error('Failed to save sounds setting:', error);
    }
  };

  const handleEffectsToggle = async (checked: boolean) => {
    onEffectsChange(checked);
    
    // Persist to database
    try {
      await supabase
        .from('game_settings')
        .upsert({ 
          setting_key: 'effects_enabled', 
          setting_value: checked.toString(),
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'setting_key' 
        });
    } catch (error) {
      console.error('Failed to save effects setting:', error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="fixed bottom-28 md:bottom-4 left-4 z-50 w-14 h-14 md:w-12 md:h-12 rounded-full 
                     bg-black/30 backdrop-blur-md hover:bg-black/50 
                     border border-white/10 transition-all duration-200
                     hover:scale-105 active:scale-95 shadow-lg touch-target-lg"
        >
          <Settings className="h-6 w-6 md:h-5 md:w-5 text-white/70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-52 p-3 bg-black/80 backdrop-blur-xl border-white/20"
        side="top"
        align="start"
      >
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white/90 mb-3">Nastavení</h4>
          
          {/* Sound toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/70">
              {localSoundsEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span className="text-sm">Zvuk</span>
            </div>
            <Switch
              checked={localSoundsEnabled}
              onCheckedChange={handleSoundsToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          {/* Effects toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/70">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Efekty</span>
            </div>
            <Switch
              checked={effectsEnabled}
              onCheckedChange={handleEffectsToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};