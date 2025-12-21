import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface TeacherPuzzleInputProps {
  onComplete: (puzzles: { phrase: string; category: string }[]) => void;
  onBack: () => void;
}

export const TeacherPuzzleInput = ({ onComplete, onBack }: TeacherPuzzleInputProps) => {
  const [puzzleCount, setPuzzleCount] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [puzzles, setPuzzles] = useState<{ phrase: string; category: string }[]>([]);

  const updatePuzzle = (index: number, field: 'phrase' | 'category', value: string) => {
    setPuzzles(prev => {
      const newPuzzles = [...prev];
      newPuzzles[index] = { ...newPuzzles[index], [field]: value };
      return newPuzzles;
    });
  };

  const handleSelectCount = (count: number) => {
    setPuzzleCount(count);
    setPuzzles(Array.from({ length: count }, () => ({ phrase: '', category: '' })));
  };

  const canProceed = puzzles[currentStep]?.phrase.trim().length > 0;
  const isLastStep = puzzleCount !== null && currentStep === puzzleCount - 1;

  const handleNext = () => {
    if (isLastStep) {
      // Filter out empty puzzles and validate
      const validPuzzles = puzzles.filter(p => p.phrase.trim().length > 0);
      if (validPuzzles.length > 0) {
        onComplete(validPuzzles.map(p => ({
          phrase: p.phrase.toUpperCase().trim(),
          category: p.category.trim() || 'Bez kategorie'
        })));
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      onBack();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Phase 1: Select puzzle count
  if (puzzleCount === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Kolik tajenek chcete zadat?
            </h2>
            <p className="text-white/60 text-lg">
              Počet tajenek = počet kol ve hře
            </p>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-12">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <Button
                key={num}
                onClick={() => handleSelectCount(num)}
                variant="outline"
                className="h-20 text-3xl font-bold bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-yellow-400 hover:text-yellow-400 transition-all duration-200"
              >
                {num}
              </Button>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onBack}
              variant="ghost"
              size="lg"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Zpět na výběr režimu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: Enter puzzles
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex justify-center gap-3 mb-8">
          {Array.from({ length: puzzleCount }).map((_, step) => (
            <div
              key={step}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? 'bg-yellow-400 scale-125 shadow-lg shadow-yellow-400/50'
                  : step < currentStep
                  ? 'bg-green-500'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Title */}
        <div className="text-center mb-8 animate-in fade-in duration-300">
          <h2 className="text-4xl font-bold text-white mb-2">
            Tajenka {currentStep + 1} z {puzzleCount}
          </h2>
          <p className="text-white/60">
            Zadejte text tajenky pro kolo {currentStep + 1}
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Text tajenky *
              </label>
              <Input
                value={puzzles[currentStep].phrase}
                onChange={(e) => updatePuzzle(currentStep, 'phrase', e.target.value)}
                placeholder="např. ARCHIMÉDŮV ZÁKON"
                className="text-2xl font-bold text-center py-6 bg-white/10 border-white/30 text-white placeholder:text-white/30 uppercase tracking-wider"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Kategorie (volitelné)
              </label>
              <Input
                value={puzzles[currentStep].category}
                onChange={(e) => updatePuzzle(currentStep, 'category', e.target.value)}
                placeholder="např. FYZIKA"
                className="text-lg text-center py-4 bg-white/10 border-white/30 text-white placeholder:text-white/30"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="lg"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {currentStep === 0 ? 'Zpět na výběr' : 'Předchozí'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            size="lg"
            className={`${
              isLastStep
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500'
            } text-white shadow-xl transition-all duration-300 disabled:opacity-50`}
          >
            {isLastStep ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Hotovo
              </>
            ) : (
              <>
                Další
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};
