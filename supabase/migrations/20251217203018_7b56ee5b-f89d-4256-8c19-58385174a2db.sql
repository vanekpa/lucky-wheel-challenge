-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create game_sessions table for remote controller feature
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code VARCHAR(10) UNIQUE NOT NULL,
  game_state JSONB DEFAULT '{}'::jsonb,
  game_mode VARCHAR(20) DEFAULT 'random',
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - anyone can read/write active sessions (game is public)
CREATE POLICY "Anyone can read active sessions"
ON public.game_sessions
FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can create sessions"
ON public.game_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update active sessions"
ON public.game_sessions
FOR UPDATE
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_game_sessions_updated_at
BEFORE UPDATE ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for game_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;