import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, RotateCw, Play, Trophy } from 'lucide-react';
import type { BonusWheelSessionState, GameCommand } from '@/hooks/useGameSession';

interface BonusWheelRemoteUIProps {
  bonusState: BonusWheelSessionState;
  onCommand: (command: GameCommand) => void;
  isPending: boolean;
  playerColor: string;
}

export const BonusWheelRemoteUI = ({ bonusState, onCommand, isPending, playerColor }: BonusWheelRemoteUIProps) => {
  const { phase, selectedOffset, winnerName, winnerScore, resultText, finalScore } = bonusState;

  return (
    <div 
      className="h-screen flex flex-col p-4 overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${playerColor}20 0%, #0f172a 100%)` }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">🎰 BONUS KOLO</h1>
        <p className="text-lg" style={{ color: playerColor }}>{winnerName}</p>
        <p className="text-xl font-bold text-white">{winnerScore.toLocaleString()} bodů</p>
      </div>

      {/* Phase indicator */}
      <div className="flex justify-center gap-1 mb-4">
        {['intro', 'ready', 'spin', 'choice', 'reveal', 'result'].map((p) => (
          <div
            key={p}
            className={`w-3 h-3 rounded-full transition-all ${
              phase === p ? 'bg-primary scale-125' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Main content based on phase */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* INTRO phase */}
        {phase === 'intro' && (
          <>
            <p className="text-center text-muted-foreground mb-4">
              Připravte se na finální bonusové kolo!
            </p>
            <Button
              onClick={() => onCommand({ type: 'BONUS_CONTINUE' })}
              disabled={isPending}
              size="lg"
              className="w-full max-w-xs py-8 text-xl animate-pulse"
              style={{ backgroundColor: playerColor }}
            >
              <Play className="w-6 h-6 mr-2" />
              POKRAČOVAT
            </Button>
          </>
        )}

        {/* READY phase */}
        {phase === 'ready' && (
          <>
            <p className="text-center text-muted-foreground mb-4">
              Kolo je připraveno. Roztočte!
            </p>
            <Button
              onClick={() => onCommand({ type: 'BONUS_SPIN' })}
              disabled={isPending}
              size="lg"
              className="w-full max-w-xs py-10 text-2xl"
              style={{ backgroundColor: playerColor }}
            >
              <RotateCw className="w-8 h-8 mr-3" />
              ROZTOČIT
            </Button>
          </>
        )}

        {/* SPIN phase */}
        {phase === 'spin' && (
          <div className="text-center">
            <RotateCw className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <p className="text-xl text-white">Kolo se točí...</p>
          </div>
        )}

        {/* CHOICE phase */}
        {phase === 'choice' && (
          <>
            <p className="text-center text-white mb-2 text-lg font-medium">
              Vyberte posun:
            </p>
            <div className="grid grid-cols-7 gap-2 w-full max-w-sm">
              {[-3, -2, -1, 0, 1, 2, 3].map((offset) => (
                <Button
                  key={offset}
                  onClick={() => onCommand({ type: 'BONUS_SELECT_OFFSET', offset })}
                  disabled={isPending}
                  variant={selectedOffset === offset ? 'default' : 'outline'}
                  className={`aspect-square text-lg font-bold ${
                    selectedOffset === offset ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {offset > 0 ? `+${offset}` : offset}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => onCommand({ type: 'BONUS_CONFIRM' })}
              disabled={isPending}
              size="lg"
              className="w-full max-w-xs py-6 text-xl mt-4"
              style={{ backgroundColor: playerColor }}
            >
              <Check className="w-6 h-6 mr-2" />
              POTVRDIT ({selectedOffset > 0 ? `+${selectedOffset}` : selectedOffset})
            </Button>
          </>
        )}

        {/* REVEAL phase */}
        {phase === 'reveal' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl text-white">Odhalování...</p>
          </div>
        )}

        {/* RESULT phase */}
        {phase === 'result' && (
          <>
            <div className="bg-slate-800/60 rounded-xl p-6 text-center w-full max-w-sm">
              <p className="text-2xl font-bold text-white mb-2">{resultText}</p>
              {finalScore !== undefined && (
                <p className="text-lg text-primary">
                  Finální skóre: {finalScore.toLocaleString()} bodů
                </p>
              )}
            </div>
            <Button
              onClick={() => onCommand({ type: 'BONUS_FINISH' })}
              disabled={isPending}
              size="lg"
              className="w-full max-w-xs py-8 text-xl"
              style={{ backgroundColor: playerColor }}
            >
              <Trophy className="w-6 h-6 mr-2" />
              ZOBRAZIT VÝSLEDKY
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
