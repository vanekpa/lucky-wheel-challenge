import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Player } from '@/types/game';
import { Sparkles, Users, Play } from 'lucide-react';

interface PlayerSetupProps {
  onComplete: (players: Player[]) => void;
}

const PRESET_COLORS = [
  { hex: '#ff6b6b', name: 'Červená' },
  { hex: '#5b8def', name: 'Modrá' },
  { hex: '#ffd700', name: 'Zlatá' },
  { hex: '#4ecdc4', name: 'Tyrkysová' },
  { hex: '#ff9f43', name: 'Oranžová' },
  { hex: '#a55eea', name: 'Fialová' },
  { hex: '#26de81', name: 'Zelená' },
  { hex: '#fd79a8', name: 'Růžová' },
  { hex: '#00cec9', name: 'Azurová' },
  { hex: '#fdcb6e', name: 'Meruňková' },
];

export const PlayerSetup = ({ onComplete }: PlayerSetupProps) => {
  const [players, setPlayers] = useState<{ name: string; color: string }[]>([
    { name: 'HRÁČ 1', color: PRESET_COLORS[0].hex },
    { name: 'HRÁČ 2', color: PRESET_COLORS[1].hex },
    { name: 'HRÁČ 3', color: PRESET_COLORS[2].hex },
  ]);
  const [focusedPlayer, setFocusedPlayer] = useState<number | null>(null);

  const updatePlayer = (index: number, field: 'name' | 'color', value: string) => {
    setPlayers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
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
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.1),transparent_50%)]" />
        
        {/* Floating orbs */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-3xl opacity-20 animate-pulse"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              background: `hsl(${i * 60}, 70%, 50%)`,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
                KOLOTOČ
              </span>
            </h1>
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5" />
            <p className="text-lg font-medium">Nastavte hráče před hrou</p>
          </div>
        </div>

        {/* Player cards container */}
        <div className="bg-card/40 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_0_60px_hsl(var(--primary)/0.1)]">
          <div className="space-y-4">
            {players.map((player, index) => (
              <div
                key={index}
                className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 border transition-all duration-300 ${
                  focusedPlayer === index
                    ? 'border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.2)] scale-[1.02]'
                    : 'border-white/10 hover:border-white/20'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Player number badge */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: player.color,
                      boxShadow: `0 8px 32px ${player.color}50`,
                    }}
                  >
                    <span className="text-white drop-shadow-md">{index + 1}</span>
                    <div
                      className="absolute inset-0 rounded-2xl opacity-50"
                      style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                      }}
                    />
                  </div>

                  <Input
                    value={player.name}
                    onChange={(e) => updatePlayer(index, 'name', e.target.value.toUpperCase())}
                    onFocus={() => setFocusedPlayer(index)}
                    onBlur={() => setFocusedPlayer(null)}
                    placeholder={`Jméno hráče ${index + 1}`}
                    className="flex-1 h-14 text-lg font-bold uppercase bg-background/50 border-white/10 focus:border-primary/50 rounded-xl placeholder:text-muted-foreground/50"
                    maxLength={15}
                  />
                </div>

                {/* Color picker */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {PRESET_COLORS.map(({ hex }) => {
                    const isSelected = player.color === hex;
                    return (
                      <button
                        key={hex}
                        onClick={() => updatePlayer(index, 'color', hex)}
                        className={`relative w-9 h-9 rounded-full transition-all duration-200 ${
                          isSelected
                            ? 'scale-125 z-10'
                            : 'hover:scale-110 opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: hex,
                          boxShadow: isSelected
                            ? `0 0 0 3px hsl(var(--background)), 0 0 0 5px ${hex}, 0 4px 20px ${hex}80`
                            : `0 2px 8px ${hex}40`,
                        }}
                        title={PRESET_COLORS.find(c => c.hex === hex)?.name}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: hex }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Start button */}
          <Button
            onClick={handleStart}
            size="lg"
            className="w-full mt-8 h-16 text-xl font-black uppercase tracking-wider bg-gradient-to-r from-primary via-yellow-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 shadow-[0_8px_32px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_40px_hsl(var(--primary)/0.5)] hover:scale-[1.02] rounded-2xl border-2 border-white/20"
          >
            <Play className="w-6 h-6 mr-2 fill-current" />
            Začít hru
          </Button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-muted-foreground/60 text-sm mt-6">
          Klikněte na barvu pro změnu • Maximálně 15 znaků
        </p>
      </div>
    </div>
  );
};
