import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { Trophy, Home, Play, AlertTriangle } from 'lucide-react';

interface EndGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBonusWheel: () => void;
  onReturnToMenu: () => void;
  players: Player[];
}

const EndGameDialog = ({
  open,
  onOpenChange,
  onBonusWheel,
  onReturnToMenu,
  players,
}: EndGameDialogProps) => {
  const [confirmReturn, setConfirmReturn] = useState(false);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const handleClose = () => {
    setConfirmReturn(false);
    onOpenChange(false);
  };

  const handleBonusWheel = () => {
    handleClose();
    onBonusWheel();
  };

  const handleReturnToMenu = () => {
    handleClose();
    onReturnToMenu();
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-primary/30 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center">
            {confirmReturn ? (
              <span className="text-destructive flex items-center justify-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Opravdu ukončit?
              </span>
            ) : (
              'Ukončit hru?'
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {confirmReturn ? (
                <div className="text-center space-y-4 py-4">
                  <p className="text-destructive font-semibold">
                    Všechny body budou ztraceny a hra skončí bez výsledku.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Tuto akci nelze vrátit zpět.
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button
                      variant="destructive"
                      onClick={handleReturnToMenu}
                      className="min-w-[120px]"
                    >
                      Ano, ukončit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmReturn(false)}
                      className="min-w-[120px]"
                    >
                      Ne, zpět
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Current scores */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Aktuální skóre:
                    </p>
                    {sortedPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span>{medals[index] || '  '}</span>
                          <span
                            className="font-semibold"
                            style={{ color: player.color }}
                          >
                            {player.name}
                          </span>
                        </span>
                        <span className="font-mono font-bold">
                          {player.score.toLocaleString()} bodů
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Options */}
                  <div className="space-y-3 pt-2">
                    {/* Bonus Wheel Option */}
                    <Button
                      variant="default"
                      className="w-full h-auto py-4 flex flex-col items-start gap-1 bg-primary/90 hover:bg-primary"
                      onClick={handleBonusWheel}
                    >
                      <span className="flex items-center gap-2 font-bold text-base">
                        <Trophy className="h-5 w-5" />
                        Bonus kolo pro vítěze
                      </span>
                      <span className="text-xs text-primary-foreground/80 font-normal">
                        {winner.name} přejde do bonus kola s šancí znásobit body
                      </span>
                    </Button>

                    {/* Return to Menu Option */}
                    <Button
                      variant="outline"
                      className="w-full h-auto py-4 flex flex-col items-start gap-1 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
                      onClick={() => setConfirmReturn(true)}
                    >
                      <span className="flex items-center gap-2 font-bold text-base">
                        <Home className="h-5 w-5" />
                        Vrátit se do menu
                      </span>
                      <span className="text-xs text-destructive font-normal flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Veškerý dosavadní průběh bude ztracen!
                      </span>
                    </Button>

                    {/* Continue Option */}
                    <Button
                      variant="secondary"
                      className="w-full h-auto py-4 flex flex-col items-start gap-1"
                      onClick={handleClose}
                    >
                      <span className="flex items-center gap-2 font-bold text-base">
                        <Play className="h-5 w-5" />
                        Pokračovat ve hře
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Zavřít dialog a pokračovat v aktuální hře
                      </span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EndGameDialog;
