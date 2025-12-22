import { cn } from '@/lib/utils';

interface Player {
  id: number;
  name: string;
  score: number;
  color: string;
}

export type ControllerMode = 'current' | number;

interface ControllerTabSelectorProps {
  players: Player[];
  currentPlayerIndex: number;
  activeMode: ControllerMode;
  onModeChange: (mode: ControllerMode) => void;
}

export const ControllerTabSelector = ({
  players,
  currentPlayerIndex,
  activeMode,
  onModeChange
}: ControllerTabSelectorProps) => {
  return (
    <div className="flex gap-1 px-2 py-1.5 bg-slate-900/80 border-b border-slate-700/50 overflow-x-auto">
      {/* Tab "Aktuální" - učitelský mód */}
      <button
        onClick={() => onModeChange('current')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
          activeMode === 'current'
            ? "bg-primary text-primary-foreground"
            : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60"
        )}
      >
        <span>🎮</span>
        <span>Aktuální</span>
        {activeMode === 'current' && (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        )}
      </button>

      {/* Hráčské taby */}
      {players.map((player, index) => {
        const isOnTurn = currentPlayerIndex === index;
        const isActive = activeMode === index;
        
        return (
          <button
            key={player.id}
            onClick={() => onModeChange(index)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              isActive
                ? "text-white"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60"
            )}
            style={isActive ? { backgroundColor: `${player.color}90` } : undefined}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: player.color }}
            />
            <span>{player.name}</span>
            {isOnTurn && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
};
