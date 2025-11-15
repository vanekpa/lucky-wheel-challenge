import { Player } from '@/types/game';

interface PlayerScoresProps {
  players: Player[];
  currentPlayer: number;
}

export const PlayerScores = ({ players, currentPlayer }: PlayerScoresProps) => {
  return (
    <div className="grid grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
      {players.map((player) => (
        <div
          key={player.id}
          className={`relative rounded-lg p-6 border-4 transition-all ${
            currentPlayer === player.id
              ? 'border-primary bg-card animate-pulse-glow'
              : 'border-muted bg-card/50'
          }`}
          style={{
            borderColor: currentPlayer === player.id ? player.color : undefined,
          }}
        >
          <div className="text-center">
            <div
              className="inline-block w-4 h-4 rounded-full mb-2"
              style={{ backgroundColor: player.color }}
            />
            <h3 className="text-lg font-bold mb-2">{player.name}</h3>
            <div className="text-4xl font-bold" style={{ color: player.color }}>
              {player.score.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">bodů</div>
          </div>
          
          {currentPlayer === player.id && (
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
