import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SessionQRCode } from '@/components/game/SessionQRCode';
import { useGameSession } from '@/hooks/useGameSession';
import { Copy, Play, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Host = () => {
  const navigate = useNavigate();
  const { session, createSession, isLoading, error } = useGameSession();
  const [sessionCode, setSessionCode] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      const code = await createSession();
      if (code) {
        setSessionCode(code);
      }
    };
    initSession();
  }, []);

  const handleCopyCode = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      toast.success('Kód zkopírován!');
    }
  };

  const handleStartGame = () => {
    if (sessionCode) {
      navigate(`/play/${sessionCode}`);
    }
  };

  const controllerUrl = sessionCode ? `${window.location.origin}/control/${sessionCode}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="absolute -top-16 left-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět
        </Button>

        {/* Main card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-2 text-foreground">
            📺 Hostovat hru
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Naskenujte QR kód telefonem pro ovládání
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Vytvářím session...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Zkusit znovu
              </Button>
            </div>
          ) : sessionCode ? (
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code */}
              <SessionQRCode sessionCode={sessionCode} size={220} />

              {/* Session code */}
              <div className="w-full">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Nebo zadejte kód:
                </p>
                <div className="flex items-center justify-center gap-3 bg-muted/50 rounded-xl p-4">
                  <span className="text-3xl font-mono font-bold tracking-wider text-primary">
                    {sessionCode}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyCode}
                    className="hover:bg-primary/20"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Controller URL */}
              <div className="w-full text-center">
                <p className="text-xs text-muted-foreground mb-1">URL ovladače:</p>
                <p className="text-xs font-mono text-primary/80 break-all">
                  {controllerUrl}
                </p>
              </div>

              {/* Start button */}
              <Button
                onClick={handleStartGame}
                size="lg"
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              >
                <Play className="w-5 h-5 mr-2" />
                Spustit hru
              </Button>
            </div>
          ) : null}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Hráči mohou ovládat hru z mobilního telefonu</p>
          <p className="mt-1">pomocí vzdáleného ovladače</p>
        </div>
      </div>
    </div>
  );
};

export default Host;
