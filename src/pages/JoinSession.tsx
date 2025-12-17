import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Gamepad2 } from 'lucide-react';
import { normalizeSessionCode, isValidSessionCode } from '@/utils/sessionCode';

const JoinSession = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedCode = normalizeSessionCode(code);
    
    if (!isValidSessionCode(normalizedCode)) {
      setError('Neplatný formát kódu. Použijte formát KOLO-XXXX');
      return;
    }

    navigate(`/control/${normalizedCode}`);
  };

  const handleCodeChange = (value: string) => {
    // Auto-format as user types
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(cleaned);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-md">
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
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Gamepad2 className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-foreground">
            Připojit se ke hře
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Zadejte kód ze zobrazené obrazovky
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="KOLO-XXXX"
                className="text-center text-2xl font-mono tracking-wider py-6 bg-muted/50"
                maxLength={9}
                autoFocus
              />
              {error && (
                <p className="text-destructive text-sm mt-2 text-center">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
              disabled={code.length < 8}
            >
              Připojit se
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Kód najdete na hlavní obrazovce hry</p>
          <p className="mt-1">nebo naskenujte QR kód</p>
        </div>
      </div>
    </div>
  );
};

export default JoinSession;
