import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Player } from '@/types/game';

interface PlayerSetupProps {
  onComplete: (players: Player[]) => void;
}

const PRESET_COLORS = [
  '#ff6b6b', '#5b8def', '#ffd700', '#4ecdc4', '#ff9f43', 
  '#a55eea', '#26de81', '#fd79a8', '#00cec9', '#fdcb6e'
];

export const PlayerSetup = ({ onComplete }: PlayerSetupProps) => {
  const [players, setPlayers] = useState<{ name: string; color: string }[]>([
    { name: 'HRÁČ 1', color: PRESET_COLORS[0] },
    { name: 'HRÁČ 2', color: PRESET_COLORS[1] },
    { name: 'HRÁČ 3', color: PRESET_COLORS[2] },
  ]);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 p-4">
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border-2 border-primary/30 max-w-lg w-full">
        <h1 className="text-4xl font-bold text-center text-primary mb-2">KOLOTOČ</h1>
        <p className="text-center text-muted-foreground mb-8">Nastavte hráče</p>
        
        <div className="space-y-6">
          {players.map((player, index) => (
            <div key={index} className="bg-background/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-4 mb-3">
                <div 
                  className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: player.color }}
                >
                  {index + 1}
                </div>
                <Input
                  value={player.name}
                  onChange={(e) => updatePlayer(index, 'name', e.target.value.toUpperCase())}
                  placeholder={`Jméno hráče ${index + 1}`}
                  className="flex-1 text-lg font-semibold uppercase"
                  maxLength={15}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updatePlayer(index, 'color', color)}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                      player.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={handleStart} 
          size="lg" 
          className="w-full mt-8 text-xl py-6 shadow-lg"
        >
          ZAČÍT HRU
        </Button>
      </div>
    </div>
  );
};
