import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Player } from "@/types/game";
import { Play, Volume2, VolumeX, Sparkles, Settings, Timer, Info } from "lucide-react";
import { useSounds, setSoundsEnabledGlobal } from "@/hooks/useSounds";
import { useTurnTimer } from "@/hooks/useTurnTimer";
import { supabase } from "@/integrations/supabase/client";

interface PlayerSetupProps {
  onComplete: (players: Player[]) => void;
}

const PRESET_COLORS = [
  { hex: "#ff6b6b", name: "Červená" },
  { hex: "#5b8def", name: "Modrá" },
  { hex: "#ffd700", name: "Zlatá" },
  { hex: "#4ecdc4", name: "Tyrkysová" },
  { hex: "#ff9f43", name: "Oranžová" },
  { hex: "#a55eea", name: "Fialová" },
  { hex: "#26de81", name: "Zelená" },
  { hex: "#fd79a8", name: "Růžová" },
];

export const PlayerSetup = ({ onComplete }: PlayerSetupProps) => {
  const [players, setPlayers] = useState<{ name: string; color: string }[]>([
    { name: "HRÁČ 1", color: PRESET_COLORS[0].hex },
    { name: "HRÁČ 2", color: PRESET_COLORS[1].hex },
    { name: "HRÁČ 3", color: PRESET_COLORS[2].hex },
  ]);
  const [focusedPlayer, setFocusedPlayer] = useState<number | null>(null);

  // Settings state
  const { soundsEnabled } = useSounds();
  const { turnTimer, setTurnTimer } = useTurnTimer();
  const [localSoundsEnabled, setLocalSoundsEnabled] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const savedSounds = localStorage.getItem("sounds_enabled");
    const savedEffects = localStorage.getItem("effects_enabled");
    const savedTimer = localStorage.getItem("turn_timer");

    if (savedSounds !== null) setLocalSoundsEnabled(savedSounds === "true");
    else setLocalSoundsEnabled(soundsEnabled);

    if (savedEffects !== null) setEffectsEnabled(savedEffects === "true");
    if (savedTimer !== null) setTurnTimer(parseInt(savedTimer) || 10);
  }, [soundsEnabled]);

  // Sync sounds globally
  useEffect(() => {
    setSoundsEnabledGlobal(localSoundsEnabled);
  }, [localSoundsEnabled]);

  const updatePlayer = (index: number, field: "name" | "color", value: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleSoundsToggle = (enabled: boolean) => {
    setLocalSoundsEnabled(enabled);
    localStorage.setItem("sounds_enabled", enabled.toString());
  };

  const handleEffectsToggle = (enabled: boolean) => {
    setEffectsEnabled(enabled);
    localStorage.setItem("effects_enabled", enabled.toString());
  };

  const handleTimerChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setTurnTimer(numValue);
    localStorage.setItem("turn_timer", numValue.toString());
  };

  const handleStart = () => {
    const gamePlayers: Player[] = players.map((p, i) => ({
      id: i,
      name: p.name || `HRÁČ ${i + 1}`,
      score: 0,
      color: p.color,
    }));
    onComplete(gamePlayers);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 overflow-hidden">
      {/* Simplified background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Compact Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
                KOLOTOČ
              </span>
            </h1>
            <Dialog>
              <DialogTrigger asChild>
                <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-center">📋 Pravidla hry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-bold text-primary mb-1">🎯 Cíl hry</h3>
                    <p className="text-muted-foreground">Uhodnout tajenku a získat co nejvíce bodů.</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">🎲 Průběh tahu</h3>
                    <ol className="text-muted-foreground list-decimal list-inside space-y-0.5">
                      <li>Roztočte kolo</li>
                      <li>Vyberte písmeno</li>
                      <li>Za každý výskyt písmene získáte vytočené body</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">⚠️ Speciální políčka</h3>
                    <ul className="text-muted-foreground space-y-0.5">
                      <li>
                        <span className="text-red-500 font-bold">BANKROT</span> – ztratíte všechny body
                      </li>
                      <li>
                        <span className="text-gray-400 font-bold">NIC</span> – pokračuje další hráč
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">🔤 Samohlásky</h3>
                    <p className="text-muted-foreground">
                      A, E, I, O, U, Y můžete hádat až od <span className="text-yellow-500 font-bold">1000 bodů</span>.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">💡 Hádat tajenku</h3>
                    <p className="text-muted-foreground">
                      Můžete zkusit uhodnout celou tajenku – za správný tip bonus bodů! Špatný tip = ztráta tahu.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">🏆 Vítěz</h3>
                    <p className="text-muted-foreground">Hráč s nejvíce body na konci hry.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">Nastavte hráče a hru</p>
        </div>

        {/* Main card */}
        <div className="bg-card/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-lg">
          {/* Player inputs - compact */}
          <div className="space-y-3 mb-4">
            {players.map((player, index) => (
              <div
                key={index}
                className={`relative bg-white/5 rounded-xl p-3 border transition-all duration-200 ${
                  focusedPlayer === index
                    ? "border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Player number badge - smaller */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-md shrink-0"
                    style={{
                      backgroundColor: player.color,
                      boxShadow: `0 4px 16px ${player.color}40`,
                    }}
                  >
                    <span className="text-white drop-shadow">{index + 1}</span>
                  </div>

                  <Input
                    value={player.name}
                    onChange={(e) => updatePlayer(index, "name", e.target.value.toUpperCase())}
                    onFocus={() => setFocusedPlayer(index)}
                    onBlur={() => setFocusedPlayer(null)}
                    placeholder={`Hráč ${index + 1}`}
                    className="flex-1 h-10 text-sm font-bold uppercase bg-background/50 border-white/10 focus:border-primary/50 rounded-lg"
                    maxLength={12}
                  />
                </div>

                {/* Color picker - compact row */}
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                  {PRESET_COLORS.map(({ hex }) => {
                    const isSelected = player.color === hex;
                    return (
                      <button
                        key={hex}
                        onClick={() => updatePlayer(index, "color", hex)}
                        className={`w-6 h-6 rounded-full transition-all duration-150 ${
                          isSelected ? "scale-125 z-10" : "opacity-60 hover:opacity-100 hover:scale-110"
                        }`}
                        style={{
                          backgroundColor: hex,
                          boxShadow: isSelected ? `0 0 0 2px hsl(var(--background)), 0 0 0 3px ${hex}` : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Game Settings Section */}
          <div className="bg-black/30 backdrop-blur rounded-xl p-3 space-y-3 mb-4 border border-white/5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Settings className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Nastavení hry</span>
            </div>

            {/* Sound toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {localSoundsEnabled ? (
                  <Volume2 className="w-4 h-4 text-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
                <Label className="text-sm">Zvuky</Label>
              </div>
              <Switch checked={localSoundsEnabled} onCheckedChange={handleSoundsToggle} />
            </div>

            {/* Effects toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${effectsEnabled ? "text-primary" : "text-muted-foreground"}`} />
                <Label className="text-sm">Sezónní efekty</Label>
              </div>
              <Switch checked={effectsEnabled} onCheckedChange={handleEffectsToggle} />
            </div>

            {/* Turn timer select */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`w-4 h-4 ${turnTimer > 0 ? "text-primary" : "text-muted-foreground"}`} />
                <Label className="text-sm">Časovač tahu</Label>
              </div>
              <Select value={turnTimer.toString()} onValueChange={handleTimerChange}>
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Vypnuto</SelectItem>
                  <SelectItem value="10">10 sekund</SelectItem>
                  <SelectItem value="15">15 sekund</SelectItem>
                  <SelectItem value="20">20 sekund</SelectItem>
                  <SelectItem value="30">30 sekund</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start button */}
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full h-12 text-lg font-black uppercase tracking-wider bg-gradient-to-r from-primary via-yellow-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 shadow-[0_4px_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_30px_hsl(var(--primary)/0.4)] hover:scale-[1.02] rounded-xl border border-white/20"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Začít hru
          </Button>
        </div>

        <p className="text-center text-muted-foreground/50 text-xs mt-3">Max 12 znaků • Klikněte na barvu pro změnu</p>
      </div>
    </div>
  );
};
