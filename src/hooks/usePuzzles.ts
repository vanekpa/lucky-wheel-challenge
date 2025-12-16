import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { puzzles as fallbackPuzzles } from '@/data/puzzles';

interface PuzzleData {
  id: string;
  phrase: string;
  category: string;
}

export const usePuzzles = () => {
  const [puzzles, setPuzzles] = useState<PuzzleData[]>(fallbackPuzzles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuzzles = async () => {
      const { data, error } = await supabase
        .from('puzzles')
        .select('id, phrase, category')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching puzzles:', error);
        // Use fallback puzzles if database is empty or error
        setPuzzles(fallbackPuzzles);
      } else if (data && data.length > 0) {
        setPuzzles(data);
      } else {
        // No puzzles in DB, use fallback
        setPuzzles(fallbackPuzzles);
      }
      setLoading(false);
    };

    fetchPuzzles();
  }, []);

  const getRandomPuzzle = () => {
    const index = Math.floor(Math.random() * puzzles.length);
    return puzzles[index];
  };

  const getRandomPuzzles = (count: number): PuzzleData[] => {
    const shuffled = [...puzzles].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  return { puzzles, loading, getRandomPuzzle, getRandomPuzzles };
};
