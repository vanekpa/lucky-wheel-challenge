import { useState, useEffect, useCallback } from 'react';
import { Settings, Volume2, VolumeX, Sparkles, X, Undo2, GraduationCap, Maximize, Minimize, Smartphone, Copy, Check, Loader2 } from 'lucide-react';
import { useIsTablet } from '@/hooks/use-tablet';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useSounds, setSoundsEnabledGlobal } from '@/hooks/useSounds';
import { useAuth } from '@/hooks/useAuth';
import { Player } from '@/types/game';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface PlayerSettingsProps {
  effectsEnabled: boolean;
  onEffectsChange: (enabled: boolean) => void;
  showEndGame?: boolean;
  onEndGame?: () => void;
  // Teacher controls
  players?: Player[];
  currentPlayer?: number;
  onSwitchPlayer?: (playerId: number) => void;
  canUndo?: boolean;
  onUndo?: () => void;
  isPlaying?: boolean;
  // Remote controller
  sessionCode?: string | null;
  onCreateSession?: () => Promise<string | null>;
  isCreatingSession?: boolean;
}

export const PlayerSettings = ({ 
  effectsEnabled, 
  onEffectsChange, 
  showEndGame, 
  onEndGame,
  players,
  currentPlayer,
  onSwitchPlayer,
  canUndo,
  onUndo,
  isPlaying,
  sessionCode,
  onCreateSession,
  isCreatingSession
}: PlayerSettingsProps) => {
  const { soundsEnabled } = useSounds();
  const { isAdmin } = useAuth();
  const { isTablet } = useIsTablet();
  const [localSoundsEnabled, setLocalSoundsEnabled] = useState(soundsEnabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const controllerUrl = sessionCode 
    ? `${window.location.origin}/control/${sessionCode}`
    : null;

  const handleCopyLink = () => {
    if (controllerUrl) {
      navigator.clipboard.writeText(controllerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    setLocalSoundsEnabled(soundsEnabled);
  }, [soundsEnabled]);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.log('Fullscreen not supported');
    }
  }, []);

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

  const showTeacherControls = isPlaying && players && onSwitchPlayer;

  const showFullscreenButton = isTablet || 'ontouchstart' in window;

  return (
    <div className="fixed bottom-28 md:bottom-4 left-4 z-50 flex items-center gap-2">
      {/* Settings Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="w-14 h-14 md:w-12 md:h-12 rounded-full 
                       bg-black/30 backdrop-blur-md hover:bg-black/50 
                       border border-white/10 transition-all duration-200
                       hover:scale-105 active:scale-95 shadow-lg touch-target-lg"
          >
            <Settings className="h-6 w-6 md:h-5 md:w-5 text-white/70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-3 bg-black/80 backdrop-blur-xl border-white/20"
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

            {/* Remote Controller Section */}
            {isPlaying && onCreateSession && (
              <div className="pt-3 mt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white/70">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm font-medium">Vzdálený ovladač</span>
                </div>
                
                {sessionCode && controllerUrl ? (
                  <div className="space-y-3">
                    {/* QR Code - larger */}
                    <div className="flex justify-center">
                      <div className="bg-white p-2 rounded-xl shadow-lg">
                        <QRCodeSVG 
                          value={controllerUrl} 
                          size={100}
                          level="M"
                        />
                      </div>
                    </div>
                    
                    {/* Session code badge */}
                    <div className="text-center">
                      <span className="text-[10px] text-white/50 block mb-1">Kód relace</span>
                      <button 
                        onClick={handleCopyLink}
                        className="font-mono text-lg text-primary font-bold tracking-widest bg-primary/10 px-4 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        {sessionCode}
                      </button>
                    </div>
                    
                    {/* Copy link button - redesigned */}
                    <Button
                      onClick={handleCopyLink}
                      size="sm"
                      className={cn(
                        "w-full text-xs transition-all duration-300",
                        copied 
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30" 
                          : "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 text-white hover:from-primary/30 hover:to-primary/20 hover:shadow-lg hover:shadow-primary/20"
                      )}
                      variant="outline"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5 animate-scale-in" />
                          Zkopírováno!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Kopírovat odkaz
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={onCreateSession}
                    variant="outline"
                    size="sm"
                    disabled={isCreatingSession}
                    className="w-full bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 text-white hover:from-primary/30 hover:to-primary/20"
                  >
                    {isCreatingSession ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aktivuji...
                      </>
                    ) : (
                      <>
                        <Smartphone className="mr-2 h-4 w-4" />
                        Aktivovat ovladač
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Teacher Controls Section */}
            {showTeacherControls && (
              <div className="pt-3 mt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white/70">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-sm font-medium">Učitelské ovládání</span>
                </div>
                
                {/* Undo button */}
                {onUndo && (
                  <Button
                    onClick={onUndo}
                    variant="outline"
                    size="sm"
                    disabled={!canUndo}
                    className="w-full bg-white/5 border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-40"
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Vrátit krok
                  </Button>
                )}
                
                {/* Switch player buttons */}
                <div className="space-y-2">
                  <span className="text-xs text-white/50">Přepnout na hráče:</span>
                  <div className="flex gap-2">
                    {players.map((player) => (
                      <Button
                        key={player.id}
                        onClick={() => onSwitchPlayer(player.id)}
                        variant="outline"
                        size="sm"
                        disabled={currentPlayer === player.id}
                        className="flex-1 text-xs px-2 py-1 border-2 disabled:opacity-40"
                        style={{ 
                          borderColor: player.color,
                          backgroundColor: currentPlayer === player.id ? player.color + '40' : 'transparent',
                          color: player.color
                        }}
                      >
                        {player.name.substring(0, 6)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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

      {/* Fullscreen button - separate, next to settings */}
      {showFullscreenButton && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleFullscreen}
          className="w-14 h-14 md:w-12 md:h-12 rounded-full 
                     bg-black/30 backdrop-blur-md hover:bg-black/50 
                     border border-white/10 transition-all duration-200
                     hover:scale-105 active:scale-95 shadow-lg touch-target-lg"
        >
          {isFullscreen ? (
            <Minimize className="h-6 w-6 md:h-5 md:w-5 text-white/70" />
          ) : (
            <Maximize className="h-6 w-6 md:h-5 md:w-5 text-white/70" />
          )}
        </Button>
      )}
    </div>
  );
};
