-- Drop existing permissive policies on puzzles table
DROP POLICY IF EXISTS "Anyone can delete puzzles" ON public.puzzles;
DROP POLICY IF EXISTS "Anyone can insert puzzles" ON public.puzzles;
DROP POLICY IF EXISTS "Anyone can update puzzles" ON public.puzzles;

-- Create admin-only policies for write operations
CREATE POLICY "Admins can insert puzzles"
ON public.puzzles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update puzzles"
ON public.puzzles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete puzzles"
ON public.puzzles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also allow admins to read all puzzles (including inactive)
CREATE POLICY "Admins can read all puzzles"
ON public.puzzles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));