import { Player } from '@/types/game';

interface PlayerScoresProps {
  players: Player[];
  currentPlayer: number;
}

export const PlayerScores = ({ players, currentPlayer }: PlayerScoresProps) => {
  return (
    <div className="fixed top-52 md:top-4 right-2 md:right-4 z-50 flex flex-col gap-1.5 md:gap-2">
      {players.map((player) => (
        <div
          key={player.id}
          className={`flex items-center gap-2 md:gap-3 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg transition-all backdrop-blur-md ${
            currentPlayer === player.id
              ? 'bg-card/90 border-2 border-primary shadow-lg scale-105'
              : 'bg-card/50 border border-border/50'
          }`}
        >
          <div
            className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md"
            style={{ backgroundColor: player.color }}
          >
            {currentPlayer === player.id ? '▶' : player.id + 1}
          </div>
          <div className="min-w-[70px] md:min-w-[100px]">
            <div className="text-[10px] md:text-xs font-semibold text-muted-foreground truncate max-w-[70px] md:max-w-[100px]">
              {player.name}
            </div>
            <div className="text-base md:text-xl font-bold" style={{ color: player.color }}>
              {player.score.toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
