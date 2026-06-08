ALTER TABLE public.puzzles
  ADD CONSTRAINT puzzles_phrase_length CHECK (char_length(phrase) BETWEEN 1 AND 200),
  ADD CONSTRAINT puzzles_category_length CHECK (char_length(category) BETWEEN 1 AND 100);