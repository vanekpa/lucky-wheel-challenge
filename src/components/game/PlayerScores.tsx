import { Player } from '@/types/game';

interface PlayerScoresProps {
  players: Player[];
  currentPlayer: number;
}

export const PlayerScores = ({ players, currentPlayer }: PlayerScoresProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/95 to-transparent backdrop-blur-sm border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg transition-all ${
                currentPlayer === player.id
                  ? 'bg-card/80 border-2 border-primary animate-pulse-glow'
                  : 'bg-card/30 border-2 border-transparent'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center"
                style={{ backgroundColor: player.color }}
              >
                {currentPlayer === player.id && (
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground">
                  {player.name}
                </div>
                <div className="text-2xl font-bold" style={{ color: player.color }}>
                  {player.score.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
