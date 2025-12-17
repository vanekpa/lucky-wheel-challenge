-- Remove foreign key constraint to allow any UUID as host_id (not just auth.users)
ALTER TABLE public.game_sessions 
DROP CONSTRAINT IF EXISTS game_sessions_host_id_fkey;