import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Pencil, Check, X, LogOut, Loader2, ShieldAlert, Upload, FileText, Snowflake, Flower2, Sun, Leaf, Moon, CloudSun, Settings2, Sparkles, Volume2, VolumeX, Eye, Gift } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSeason, Season, DayTime, seasonColors } from '@/hooks/useSeason';
import { useGameSettings } from '@/hooks/useGameSettings';
import { z } from 'zod';

// Validation schema for puzzle data
const puzzleSchema = z.object({
  phrase: z.string()
    .min(1, 'Fráze je povinná')
    .max(200, 'Fráze je příliš dlouhá (max 200 znaků)')
    .regex(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9\s.,!?;:'"()-]+$/i, 'Neplatné znaky ve frázi'),
  category: z.string()
    .min(1, 'Kategorie je povinná')
    .max(100, 'Kategorie je příliš dlouhá (max 100 znaků)')
});

interface Puzzle {
  id: string;
  phrase: string;
  category: string;
  created_by: string | null;
  is_active: boolean;
}

const Admin = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhrase, setNewPhrase] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhrase, setEditPhrase] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const { season, dayTime, effectsEnabled, isAutoSeason, isAutoDayTime } = useSeason();
  const { updateSetting, updating } = useGameSettings();

  // Current setting values for UI
  const [currentSeasonSetting, setCurrentSeasonSetting] = useState<string>('auto');
  const [currentDayTimeSetting, setCurrentDayTimeSetting] = useState<string>('auto');
  const [currentEffectsEnabled, setCurrentEffectsEnabled] = useState(true);
  const [currentSoundsEnabled, setCurrentSoundsEnabled] = useState(true);
  
  // Preview state (separate from actual settings)
  const [previewSeason, setPreviewSeason] = useState<Season | null>(null);
  const [previewDayTime, setPreviewDayTime] = useState<DayTime | null>(null);

  // Fetch current settings
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      const { data } = await supabase
        .from('game_settings')
        .select('setting_key, setting_value');
      
      if (data) {
        data.forEach((setting) => {
          if (setting.setting_key === 'season') setCurrentSeasonSetting(setting.setting_value);
          else if (setting.setting_key === 'day_time') setCurrentDayTimeSetting(setting.setting_value);
          else if (setting.setting_key === 'effects_enabled') setCurrentEffectsEnabled(setting.setting_value === 'true');
          else if (setting.setting_key === 'sounds_enabled') setCurrentSoundsEnabled(setting.setting_value === 'true');
        });
      }
    };
    fetchCurrentSettings();
  }, []);
  
  // Get preview colors
  const getPreviewColors = () => {
    const s = previewSeason || season;
    const d = previewDayTime || dayTime;
    return seasonColors[s][d];
  };
  
  const previewColors = getPreviewColors();
  const displaySeason = previewSeason || season;
  const displayDayTime = previewDayTime || dayTime;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPuzzles();
    }
  }, [user, isAdmin]);

  const fetchPuzzles = async () => {
    const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Chyba při načítání tajenek');
      console.error(error);
    } else {
      setPuzzles(data || []);
    }
    setLoading(false);
  };

  const addPuzzle = async () => {
    // Validate input using zod schema
    const validationResult = puzzleSchema.safeParse({
      phrase: newPhrase.trim(),
      category: newCategory.trim()
    });

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    const { error } = await supabase.from('puzzles').insert({
      phrase: validationResult.data.phrase.toUpperCase(),
      category: validationResult.data.category,
      created_by: user?.email || 'Admin',
    });

    if (error) {
      toast.error('Chyba při přidávání tajenky');
    } else {
      toast.success('Tajenka přidána!');
      setNewPhrase('');
      setNewCategory('');
      fetchPuzzles();
    }
  };

  const deletePuzzle = async (id: string) => {
    const { error } = await supabase.from('puzzles').delete().eq('id', id);
    
    if (error) {
      toast.error('Chyba při mazání tajenky');
      console.error(error);
    } else {
      toast.success('Tajenka smazána');
      fetchPuzzles();
    }
  };

  const startEdit = (puzzle: Puzzle) => {
    setEditingId(puzzle.id);
    setEditPhrase(puzzle.phrase);
    setEditCategory(puzzle.category);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    // Validate input using zod schema
    const validationResult = puzzleSchema.safeParse({
      phrase: editPhrase.trim(),
      category: editCategory.trim()
    });

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    const { error } = await supabase
      .from('puzzles')
      .update({ 
        phrase: validationResult.data.phrase.toUpperCase(), 
        category: validationResult.data.category 
      })
      .eq('id', editingId);

    if (error) {
      toast.error('Chyba při úpravě');
    } else {
      toast.success('Uloženo');
      setEditingId(null);
      fetchPuzzles();
    }
  };

  const toggleActive = async (puzzle: Puzzle) => {
    const { error } = await supabase
      .from('puzzles')
      .update({ is_active: !puzzle.is_active })
      .eq('id', puzzle.id);

    if (error) {
      toast.error('Chyba při změně stavu');
    } else {
      fetchPuzzles();
    }
  };

  const bulkImport = async () => {
    if (!bulkText.trim()) {
      toast.error('Vložte text s tajenkami');
      return;
    }
    
    // Validate category
    const categoryValidation = z.string()
      .min(1, 'Kategorie je povinná')
      .max(100, 'Kategorie je příliš dlouhá')
      .safeParse(bulkCategory.trim());
    
    if (!categoryValidation.success) {
      toast.error(categoryValidation.error.errors[0].message);
      return;
    }

    setIsBulkImporting(true);

    // Parse lines - each line is one puzzle
    const lines = bulkText
      .split('\n')
      .map(line => line.trim().toUpperCase())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      toast.error('Žádné platné tajenky k importu');
      setIsBulkImporting(false);
      return;
    }

    // Validate each phrase
    const phraseSchema = z.string()
      .min(1)
      .max(200, 'Fráze je příliš dlouhá (max 200 znaků)')
      .regex(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9\s.,!?;:'"()-]+$/i, 'Neplatné znaky');

    const invalidPhrases: string[] = [];
    const validLines: string[] = [];
    
    for (const phrase of lines) {
      const result = phraseSchema.safeParse(phrase);
      if (result.success) {
        validLines.push(phrase);
      } else {
        invalidPhrases.push(phrase.substring(0, 30) + (phrase.length > 30 ? '...' : ''));
      }
    }

    if (invalidPhrases.length > 0 && validLines.length === 0) {
      toast.error(`Všechny fráze obsahují neplatné znaky nebo jsou příliš dlouhé`);
      setIsBulkImporting(false);
      return;
    }

    // Get existing phrases for duplicate detection
    const existingPhrases = new Set(puzzles.map(p => p.phrase.toUpperCase()));
    
    const toImport: string[] = [];
    const duplicates: string[] = [];

    for (const phrase of validLines) {
      if (existingPhrases.has(phrase) || toImport.includes(phrase)) {
        duplicates.push(phrase);
      } else {
        toImport.push(phrase);
      }
    }

    if (toImport.length === 0) {
      toast.error(`Všechny tajenky (${duplicates.length}) jsou duplicitní`);
      setIsBulkImporting(false);
      return;
    }

    // Insert all unique puzzles
    const puzzlesToInsert = toImport.map(phrase => ({
      phrase,
      category: categoryValidation.data,
      created_by: user?.email || 'Admin',
    }));

    const { error } = await supabase.from('puzzles').insert(puzzlesToInsert);

    if (error) {
      toast.error('Chyba při importu');
    } else {
      let message = `Importováno ${toImport.length} tajenek`;
      if (duplicates.length > 0) message += ` (${duplicates.length} duplicit přeskočeno)`;
      if (invalidPhrases.length > 0) message += ` (${invalidPhrases.length} neplatných přeskočeno)`;
      toast.success(message);
      setBulkText('');
      setBulkCategory('');
      fetchPuzzles();
    }

    setIsBulkImporting(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3e] to-[#2a1a4a]">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return null;
  }

  // Not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3e] to-[#2a1a4a] p-8">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[120px] animate-pulse" />
        
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 shadow-2xl text-center max-w-md relative z-10">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-500/20 rounded-2xl border border-red-400/30">
              <ShieldAlert className="h-10 w-10 text-red-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Přístup odepřen</h1>
          <p className="text-white/50 mb-6">
            Váš účet ({user.email}) nemá oprávnění administrátora.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link to="/">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na hru
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="text-white/50 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Odhlásit se
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3e] to-[#2a1a4a] p-4">
      {/* Spotlight effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white">Správa Tajenek</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm hidden sm:block">{user.email}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Odhlásit
            </Button>
          </div>
        </div>

        {/* Environment Settings */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Nastavení prostředí
          </h2>
          
          {/* Preview Box */}
          <div className="mb-6">
            <label className="text-white/70 text-sm mb-2 block flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Náhled prostředí
            </label>
            <div 
              className={`relative h-32 rounded-xl overflow-hidden border border-white/20 bg-gradient-to-br ${previewColors.gradient} transition-all duration-500`}
            >
              {/* Stars for night */}
              {displayDayTime === 'night' && (
                <div className="absolute inset-0">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 60}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        opacity: 0.3 + Math.random() * 0.7,
                      }}
                    />
                  ))}
                  <div className="absolute top-4 right-8 w-8 h-8 bg-yellow-100 rounded-full shadow-[0_0_20px_10px_rgba(255,255,200,0.3)]" />
                </div>
              )}
              
              {/* Sun for day */}
              {displayDayTime === 'day' && displaySeason === 'summer' && (
                <div className="absolute top-4 right-8 w-10 h-10 bg-yellow-400 rounded-full shadow-[0_0_30px_15px_rgba(255,200,0,0.4)]" />
              )}
              
              {/* Season particles */}
              <div className="absolute inset-0 overflow-hidden">
                {currentEffectsEnabled && Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-xl animate-bounce"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 20}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s',
                    }}
                  >
                    {displaySeason === 'winter' && '❄️'}
                    {displaySeason === 'christmas' && '🎄'}
                    {displaySeason === 'spring' && '🌸'}
                    {displaySeason === 'summer' && '✨'}
                    {displaySeason === 'autumn' && '🍂'}
                  </div>
                ))}
              </div>
              
              {/* Label */}
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-sm">
                {displaySeason === 'winter' && '❄️ Zima'}
                {displaySeason === 'christmas' && '🎄 Vánoce'}
                {displaySeason === 'spring' && '🌸 Jaro'}
                {displaySeason === 'summer' && '☀️ Léto'}
                {displaySeason === 'autumn' && '🍂 Podzim'}
                {' + '}
                {displayDayTime === 'day' ? '☀️ Den' : '🌙 Noc'}
              </div>
            </div>
            
            {/* Quick preview buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-white/50 text-xs mr-2 self-center">Rychlý náhled:</span>
              {(['winter', 'christmas', 'spring', 'summer', 'autumn'] as Season[]).map((s) => (
                <Button
                  key={s}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewSeason(s)}
                  className={`text-xs px-2 py-1 h-7 ${previewSeason === s ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  {s === 'winter' && '❄️'}
                  {s === 'christmas' && '🎄'}
                  {s === 'spring' && '🌸'}
                  {s === 'summer' && '☀️'}
                  {s === 'autumn' && '🍂'}
                </Button>
              ))}
              <div className="w-px h-6 bg-white/20 self-center mx-1" />
              {(['day', 'night'] as DayTime[]).map((d) => (
                <Button
                  key={d}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDayTime(d)}
                  className={`text-xs px-2 py-1 h-7 ${previewDayTime === d ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  {d === 'day' ? '☀️' : '🌙'}
                </Button>
              ))}
              {(previewSeason || previewDayTime) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setPreviewSeason(null); setPreviewDayTime(null); }}
                  className="text-xs px-2 py-1 h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
          
          {/* Season selection */}
          <div className="mb-6">
            <label className="text-white/70 text-sm mb-2 block">Sezóna (uložená)</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'auto', label: 'Auto', icon: Sparkles },
                { value: 'winter', label: 'Zima', icon: Snowflake },
                { value: 'christmas', label: 'Vánoce', icon: Gift },
                { value: 'spring', label: 'Jaro', icon: Flower2 },
                { value: 'summer', label: 'Léto', icon: Sun },
                { value: 'autumn', label: 'Podzim', icon: Leaf },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={currentSeasonSetting === value ? 'default' : 'outline'}
                  size="sm"
                  disabled={updating}
                  onClick={() => {
                    setCurrentSeasonSetting(value);
                    updateSetting('season', value);
                  }}
                  className={`${
                    currentSeasonSetting === value
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0'
                      : 'border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Day/Night selection */}
          <div className="mb-6">
            <label className="text-white/70 text-sm mb-2 block">Denní doba (uložená)</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'auto', label: 'Auto', icon: Sparkles },
                { value: 'day', label: 'Den', icon: CloudSun },
                { value: 'night', label: 'Noc', icon: Moon },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={currentDayTimeSetting === value ? 'default' : 'outline'}
                  size="sm"
                  disabled={updating}
                  onClick={() => {
                    setCurrentDayTimeSetting(value);
                    updateSetting('day_time', value);
                  }}
                  className={`${
                    currentDayTimeSetting === value
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0'
                      : 'border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Effects toggle */}
          <div className="mb-4">
            <label className="text-white/70 text-sm mb-2 block">Vizuální efekty</label>
            <div className="flex gap-2">
              <Button
                variant={currentEffectsEnabled ? 'default' : 'outline'}
                size="sm"
                disabled={updating}
                onClick={() => {
                  setCurrentEffectsEnabled(true);
                  updateSetting('effects_enabled', 'true');
                }}
                className={`${
                  currentEffectsEnabled
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'
                    : 'border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Check className="h-4 w-4 mr-1" />
                Zapnuté
              </Button>
              <Button
                variant={!currentEffectsEnabled ? 'default' : 'outline'}
                size="sm"
                disabled={updating}
                onClick={() => {
                  setCurrentEffectsEnabled(false);
                  updateSetting('effects_enabled', 'false');
                }}
                className={`${
                  !currentEffectsEnabled
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0'
                    : 'border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <X className="h-4 w-4 mr-1" />
                Vypnuté
              </Button>
            </div>
          </div>

          {/* Sounds toggle */}
          <div className="mb-4">
            <label className="text-white/70 text-sm mb-2 block">Zvuky</label>
            <div className="flex gap-2">
              <Button
                variant={currentSoundsEnabled ? 'default' : 'outline'}
                size="sm"
                disabled={updating}
                onClick={() => {
                  setCurrentSoundsEnabled(true);
                  updateSetting('sounds_enabled', 'true');
                }}
                className={`${
                  currentSoundsEnabled
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0'
                    : 'border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Volume2 className="h-4 w-4 mr-1" />
                Zapnuté
              </Button>
              <Button
                variant={!currentSoundsEnabled ? 'default' : 'outline'}
                size="sm"
                disabled={updating}
                onClick={() => {
                  setCurrentSoundsEnabled(false);
                  updateSetting('sounds_enabled', 'false');
                }}
                className={`${
                  !currentSoundsEnabled
                    ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0'
                    : 'border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <VolumeX className="h-4 w-4 mr-1" />
                Vypnuté
              </Button>
            </div>
          </div>

          {/* Current state display */}
          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/50 text-sm">
              Aktuální stav: 
              <span className="text-white ml-2">
                {season === 'winter' && '❄️ Zima'}
                {season === 'spring' && '🌸 Jaro'}
                {season === 'summer' && '☀️ Léto'}
                {season === 'autumn' && '🍂 Podzim'}
                {' + '}
                {dayTime === 'day' ? '☀️ Den' : '🌙 Noc'}
                {!effectsEnabled && ' (efekty vypnuté)'}
                {!currentSoundsEnabled && ' (zvuky vypnuté)'}
              </span>
            </p>
          </div>
        </div>

        {/* Add new puzzle */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Přidat novou tajenku</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              placeholder="Tajenka (např. KOLOTOČ ŠTĚSTÍ)"
              className="flex-1 uppercase bg-white/5 border-white/20 text-white placeholder:text-white/30"
            />
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Kategorie"
              className="w-full sm:w-40 bg-white/5 border-white/20 text-white placeholder:text-white/30"
            />
            <Button onClick={addPuzzle} className="shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Přidat
            </Button>
          </div>
        </div>

        {/* Bulk import */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hromadný import
          </h2>
          <p className="text-white/50 text-sm mb-4">
            Vložte tajenky - každou na nový řádek. Duplicity budou automaticky přeskočeny.
          </p>
          <div className="space-y-3">
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"PRVNÍ TAJENKA\nDRUHÁ TAJENKA\nTŘETÍ TAJENKA"}
              className="min-h-[120px] uppercase bg-white/5 border-white/20 text-white placeholder:text-white/30 font-mono"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                placeholder="Kategorie pro všechny"
                className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
              <Button 
                onClick={bulkImport} 
                disabled={isBulkImporting}
                className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white"
              >
                {isBulkImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importovat ({bulkText.split('\n').filter(l => l.trim()).length})
              </Button>
            </div>
          </div>
        </div>

        {/* Puzzle list */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Seznam tajenek ({puzzles.length})
          </h2>
          
          {loading ? (
            <div className="flex items-center gap-2 text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Načítání...
            </div>
          ) : puzzles.length === 0 ? (
            <p className="text-white/50">Žádné tajenky. Přidejte první!</p>
          ) : (
            <div className="space-y-2">
              {puzzles.map((puzzle) => (
                <div
                  key={puzzle.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    puzzle.is_active 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}
                >
                  {editingId === puzzle.id ? (
                    <>
                      <Input
                        value={editPhrase}
                        onChange={(e) => setEditPhrase(e.target.value)}
                        className="flex-1 uppercase bg-white/5 border-white/20 text-white"
                      />
                      <Input
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-32 bg-white/5 border-white/20 text-white"
                      />
                      <Button size="icon" variant="ghost" onClick={saveEdit} className="text-emerald-400 hover:bg-emerald-400/10">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="text-red-400 hover:bg-red-400/10">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{puzzle.phrase}</p>
                        <p className="text-sm text-white/50">{puzzle.category}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(puzzle)}
                        className={puzzle.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-white/40 hover:bg-white/10'}
                      >
                        {puzzle.is_active ? 'Aktivní' : 'Neaktivní'}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(puzzle)} className="text-white/60 hover:text-white hover:bg-white/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deletePuzzle(puzzle.id)} className="text-red-400 hover:bg-red-400/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
