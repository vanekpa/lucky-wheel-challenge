import { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useSounds, setSoundsEnabledGlobal } from '@/hooks/useSounds';
import { useAuth } from '@/hooks/useAuth';

interface PlayerSettingsProps {
  effectsEnabled: boolean;
  onEffectsChange: (enabled: boolean) => void;
  showEndGame?: boolean;
  onEndGame?: () => void;
}

export const PlayerSettings = ({ effectsEnabled, onEffectsChange, showEndGame, onEndGame }: PlayerSettingsProps) => {
  const { soundsEnabled } = useSounds();
  const { isAdmin } = useAuth();
  const [localSoundsEnabled, setLocalSoundsEnabled] = useState(soundsEnabled);

  useEffect(() => {
    setLocalSoundsEnabled(soundsEnabled);
  }, [soundsEnabled]);

  const handleSoundsToggle = async (checked: boolean) => {
    setLocalSoundsEnabled(checked);
    setSoundsEnabledGlobal(checked);
    
    // Only admins can persist to database
    if (isAdmin) {
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
        // Silently fail for non-admins - RLS will block anyway
      }
    } else {
      // Non-admins save to localStorage only
      localStorage.setItem('sounds_enabled', checked.toString());
    }
  };

  const handleEffectsToggle = async (checked: boolean) => {
    onEffectsChange(checked);
    
    // Only admins can persist to database
    if (isAdmin) {
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
        // Silently fail for non-admins - RLS will block anyway
      }
    } else {
      // Non-admins save to localStorage only
      localStorage.setItem('effects_enabled', checked.toString());
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

          {/* End Game button - conditionally shown */}
          {showEndGame && onEndGame && (
            <div className="pt-2 mt-2 border-t border-white/10">
              <Button
                onClick={onEndGame}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Ukončit hru
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
