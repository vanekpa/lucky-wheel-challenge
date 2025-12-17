-- Add RLS policy for DELETE on game_sessions
CREATE POLICY "Anyone can delete inactive sessions" 
ON public.game_sessions 
FOR DELETE 
USING (is_active = false OR updated_at < NOW() - INTERVAL '60 minutes');