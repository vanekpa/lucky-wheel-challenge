import { Button } from "@/components/ui/button";
import { SavedGameState, getSavedGameInfo } from "@/utils/gameStorage";
import { Play, Trash2 } from "lucide-react";

interface SavedGameDialogProps {
  savedGame: SavedGameState;
  onResume: () => void;
  onNewGame: () => void;
}

export const SavedGameDialog = ({
  savedGame,
  onResume,
  onNewGame,
}: SavedGameDialogProps) => {
  const { roundInfo, players, savedAgo } = getSavedGameInfo(savedGame);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-primary/30 rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl shadow-primary/20 animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-primary">
          🎮 Rozehraná hra
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          Uloženo {savedAgo}
        </p>

        {/* Game info */}
        <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
          <p className="text-center text-lg font-semibold text-white/90 mb-3">
            {roundInfo} • {savedGame.gameMode === "teacher" ? "Učitelský mód" : "Rychlá hra"}
          </p>

          {/* Player scores */}
          <div className="space-y-2">
            {players.map((player, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/30"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-medium text-white/90">{player.name}</span>
                </div>
                <span className="font-bold text-primary">{player.score.toLocaleString()} b.</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onResume}
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg py-6 shadow-lg shadow-green-500/30"
          >
            <Play className="w-5 h-5 mr-2" />
            Pokračovat ve hře
          </Button>
          <Button
            onClick={onNewGame}
            variant="outline"
            size="lg"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Zahodit a začít znovu
          </Button>
        </div>
      </div>
    </div>
  );
};
