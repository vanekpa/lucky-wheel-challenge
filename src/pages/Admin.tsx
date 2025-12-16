import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Plus, ArrowLeft, Pencil, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    fetchPuzzles();
  }, []);

  const addPuzzle = async () => {
    if (!newPhrase.trim() || !newCategory.trim()) {
      toast.error('Vyplňte všechna pole');
      return;
    }

    const { error } = await supabase.from('puzzles').insert({
      phrase: newPhrase.toUpperCase().trim(),
      category: newCategory.trim(),
      created_by: 'Učitel',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400/30 via-purple-400/30 to-pink-400/30 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">Správa Tajenek</h1>
        </div>

        {/* Add new puzzle */}
        <div className="bg-card/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-primary/30 mb-6">
          <h2 className="text-xl font-semibold mb-4">Přidat novou tajenku</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              placeholder="Tajenka (např. KOLOTOČ ŠTĚSTÍ)"
              className="flex-1 uppercase"
            />
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Kategorie"
              className="w-full sm:w-40"
            />
            <Button onClick={addPuzzle} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Přidat
            </Button>
          </div>
        </div>

        {/* Puzzle list */}
        <div className="bg-card/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-primary/30">
          <h2 className="text-xl font-semibold mb-4">
            Seznam tajenek ({puzzles.length})
          </h2>
          
          {loading ? (
            <p className="text-muted-foreground">Načítání...</p>
          ) : puzzles.length === 0 ? (
            <p className="text-muted-foreground">Žádné tajenky. Přidejte první!</p>
          ) : (
            <div className="space-y-2">
              {puzzles.map((puzzle) => (
                <div
                  key={puzzle.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    puzzle.is_active 
                      ? 'bg-background/50 border-border' 
                      : 'bg-muted/30 border-muted opacity-60'
                  }`}
                >
                  {editingId === puzzle.id ? (
                    <>
                      <Input
                        value={editPhrase}
                        onChange={(e) => setEditPhrase(e.target.value)}
                        className="flex-1 uppercase"
                      />
                      <Input
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-32"
                      />
                      <Button size="icon" variant="ghost" onClick={saveEdit}>
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-semibold">{puzzle.phrase}</p>
                        <p className="text-sm text-muted-foreground">{puzzle.category}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={puzzle.is_active ? 'secondary' : 'outline'}
                        onClick={() => toggleActive(puzzle)}
                      >
                        {puzzle.is_active ? 'Aktivní' : 'Neaktivní'}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(puzzle)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deletePuzzle(puzzle.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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
