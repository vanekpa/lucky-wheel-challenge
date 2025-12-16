import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { playVictoryFanfare } from '@/utils/sounds';

interface VictoryScreenProps {
  players: Player[];
  onPlayAgain: () => void;
  onNewGame: () => void;
}

const VictoryScreen = ({ players, onPlayAgain, onNewGame }: VictoryScreenProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);
  
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  
  useEffect(() => {
    playVictoryFanfare();
    
    // Generate confetti
    const colors = ['#ffd700', '#ff6b6b', '#5b8def', '#4ade80', '#f472b6', '#a855f7'];
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(newConfetti);
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background/95 to-primary/20 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Confetti */}
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
      
      {/* Content */}
      <div className="text-center z-10 animate-in fade-in duration-700">
        <h1 className="text-5xl md:text-7xl font-bold text-primary mb-2 animate-victory-pulse">
          🏆 KONEC HRY 🏆
        </h1>
        
        {/* Winner highlight */}
        <div className="mb-8">
          <div className="text-6xl mb-2 animate-trophy-bounce">👑</div>
          <p className="text-2xl text-muted-foreground">Vítěz:</p>
          <p className="text-5xl font-bold" style={{ color: winner.color }}>
            {winner.name}
          </p>
          <p className="text-4xl text-primary font-bold mt-2">
            {winner.score.toLocaleString()} bodů
          </p>
        </div>
        
        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-10">
          {/* 2nd place */}
          {sortedPlayers[1] && (
            <div className="flex flex-col items-center">
              <p className="text-xl font-bold mb-2" style={{ color: sortedPlayers[1].color }}>
                {sortedPlayers[1].name}
              </p>
              <p className="text-lg text-muted-foreground mb-2">
                {sortedPlayers[1].score.toLocaleString()}
              </p>
              <div className="w-24 h-24 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-lg flex items-center justify-center">
                <span className="text-4xl">🥈</span>
              </div>
            </div>
          )}
          
          {/* 1st place */}
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold mb-2" style={{ color: winner.color }}>
              {winner.name}
            </p>
            <p className="text-xl text-primary mb-2">
              {winner.score.toLocaleString()}
            </p>
            <div className="w-28 h-32 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-lg flex items-center justify-center animate-bonus-glow">
              <span className="text-5xl">🥇</span>
            </div>
          </div>
          
          {/* 3rd place */}
          {sortedPlayers[2] && (
            <div className="flex flex-col items-center">
              <p className="text-xl font-bold mb-2" style={{ color: sortedPlayers[2].color }}>
                {sortedPlayers[2].name}
              </p>
              <p className="text-lg text-muted-foreground mb-2">
                {sortedPlayers[2].score.toLocaleString()}
              </p>
              <div className="w-24 h-20 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-lg flex items-center justify-center">
                <span className="text-4xl">🥉</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={onPlayAgain}
            variant="outline"
            size="lg"
            className="px-8 py-6 text-xl"
          >
            Hrát znovu
          </Button>
          <Button
            onClick={onNewGame}
            size="lg"
            className="px-8 py-6 text-xl animate-bonus-glow"
          >
            Nová hra
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VictoryScreen;