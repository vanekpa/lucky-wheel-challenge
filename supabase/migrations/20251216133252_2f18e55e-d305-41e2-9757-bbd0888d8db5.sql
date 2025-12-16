-- Create puzzles table for storing game phrases
CREATE TABLE public.puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase TEXT NOT NULL,
  category TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active puzzles (game needs this)
CREATE POLICY "Anyone can read active puzzles"
ON public.puzzles
FOR SELECT
USING (is_active = true);

-- For admin insert/update/delete, we'll use a simple password check in the app
-- since this is a classroom game without user authentication
CREATE POLICY "Anyone can insert puzzles"
ON public.puzzles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update puzzles"
ON public.puzzles
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete puzzles"
ON public.puzzles
FOR DELETE
USING (true);