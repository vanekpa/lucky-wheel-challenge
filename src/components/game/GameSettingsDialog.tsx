import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSounds, setSoundsEnabledGlobal } from '@/hooks/useSounds';
import { useAuth } from '@/hooks/useAuth';

interface GameSettingsDialogProps {
  effectsEnabled: boolean;
  onEffectsChange: (enabled: boolean) => void;
}

export const GameSettingsDialog = ({ effectsEnabled, onEffectsChange }: GameSettingsDialogProps) => {
  const { soundsEnabled } = useSounds();
  const { isAdmin } = useAuth();
  const [localSoundsEnabled, setLocalSoundsEnabled] = useState(soundsEnabled);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLocalSoundsEnabled(soundsEnabled);
  }, [soundsEnabled]);

  const handleSoundsToggle = async (enabled: boolean) => {
    setLocalSoundsEnabled(enabled);
    setSoundsEnabledGlobal(enabled); // Sync global state immediately
    
    // Only admins can persist to database
    if (isAdmin) {
      await supabase
        .from('game_settings')
        .upsert({ 
          setting_key: 'sounds_enabled', 
          setting_value: enabled ? 'true' : 'false' 
        }, { 
          onConflict: 'setting_key' 
        });
    } else {
      // Non-admins save to localStorage only
      localStorage.setItem('sounds_enabled', enabled ? 'true' : 'false');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50 bg-black/40 backdrop-blur-md hover:bg-black/60 border border-white/10"
        >
          <Settings className="h-5 w-5 text-white/80" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[350px] bg-background/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Nastavení hry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sounds toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {localSoundsEnabled ? (
                <Volume2 className="h-5 w-5 text-primary" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <Label htmlFor="sounds" className="text-base font-medium">
                Zvuky
              </Label>
            </div>
            <Switch
              id="sounds"
              checked={localSoundsEnabled}
              onCheckedChange={handleSoundsToggle}
            />
          </div>

          {/* Effects toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className={`h-5 w-5 ${effectsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <Label htmlFor="effects" className="text-base font-medium">
                Sezónní efekty
              </Label>
            </div>
            <Switch
              id="effects"
              checked={effectsEnabled}
              onCheckedChange={onEffectsChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
