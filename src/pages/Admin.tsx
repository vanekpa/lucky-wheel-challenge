import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Pencil, Check, X, LogOut, Loader2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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

  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();

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
    if (!newPhrase.trim() || !newCategory.trim()) {
      toast.error('Vyplňte všechna pole');
      return;
    }

    const { error } = await supabase.from('puzzles').insert({
      phrase: newPhrase.toUpperCase().trim(),
      category: newCategory.trim(),
      created_by: user?.email || 'Admin',
    });

    if (error) {
      toast.error('Chyba při přidávání tajenky');
      console.error(error);
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

    const { error } = await supabase
      .from('puzzles')
      .update({ phrase: editPhrase.toUpperCase().trim(), category: editCategory.trim() })
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
