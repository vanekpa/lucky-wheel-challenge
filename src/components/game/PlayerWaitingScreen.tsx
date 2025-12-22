import { ArrowLeft, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ControllerTabSelector, type ControllerMode } from './ControllerTabSelector';

interface Player {
  id: number;
  name: string;
  score: number;
  color: string;
}

interface PuzzlePreview {
  phrase: string;
  category: string;
  revealed: Set<string>;
}

interface PlayerWaitingScreenProps {
  player: Player;
  currentPlayer: Player;
  players: Player[];
  currentPlayerIndex: number;
  activeMode: ControllerMode;
  onModeChange: (mode: ControllerMode) => void;
  puzzlePreview: PuzzlePreview | null;
  onBack: () => void;
}

export const PlayerWaitingScreen = ({
  player,
  currentPlayer,
  players,
  currentPlayerIndex,
  activeMode,
  onModeChange,
  puzzlePreview,
  onBack
}: PlayerWaitingScreenProps) => {
  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${player.color}10 0%, #0f172a 50%)` }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Button>
        
        <div 
          className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ backgroundColor: `${player.color}30`, border: `2px solid ${player.color}` }}
        >
          <User className="w-3 h-3" style={{ color: player.color }} />
          <span className="font-bold text-sm" style={{ color: player.color }}>{player.name}</span>
        </div>

        <div className="font-bold text-lg text-white">{player.score}</div>
      </header>

      {/* Tab Selector */}
      <ControllerTabSelector
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        activeMode={activeMode}
        onModeChange={onModeChange}
      />

      {/* Waiting Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Waiting indicator */}
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full border-4 border-dashed animate-spin"
            style={{ borderColor: `${player.color}40`, animationDuration: '8s' }}
          />
          <div 
            className="absolute inset-0 flex items-center justify-center"
          >
            <Clock className="w-10 h-10" style={{ color: player.color }} />
          </div>
        </div>

        {/* Waiting text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            ⏳ Čekej na svůj tah
          </h2>
          <p className="text-slate-400">
            Právě hraje: <span className="font-bold" style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
          </p>
        </div>

        {/* Puzzle preview */}
        {puzzlePreview && (
          <div className="w-full max-w-xs bg-slate-800/60 rounded-xl p-4 border border-slate-700/30">
            <p className="text-[10px] text-slate-500 text-center mb-2">{puzzlePreview.category}</p>
            <p className="text-white font-mono text-sm text-center tracking-wider leading-relaxed">
              {puzzlePreview.phrase.split('').map((char, i) => {
                if (char === ' ') return '  ';
                if (!/[A-ZÁ-Ža-zá-ž]/i.test(char)) return char;
                return puzzlePreview.revealed.has(char.toUpperCase()) ? char : '·';
              }).join('')}
            </p>
          </div>
        )}

        {/* Player score card */}
        <div 
          className="px-6 py-3 rounded-xl"
          style={{ backgroundColor: `${player.color}20`, border: `2px solid ${player.color}50` }}
        >
          <p className="text-xs text-slate-400 text-center mb-1">Tvé skóre</p>
          <p className="text-3xl font-bold text-center" style={{ color: player.color }}>
            {player.score.toLocaleString()}
          </p>
        </div>
      </main>

      {/* Tip at bottom */}
      <footer className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/30 text-center">
        <p className="text-xs text-slate-500">
          💡 Budeš upozorněn, až na tebe přijde řada
        </p>
      </footer>
    </div>
  );
};
