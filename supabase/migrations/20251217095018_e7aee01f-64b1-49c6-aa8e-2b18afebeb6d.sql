-- Anonymize existing email addresses by setting to NULL
-- (we can't convert emails to UUIDs without knowing which user created them)
UPDATE public.puzzles SET created_by = NULL WHERE created_by IS NOT NULL;

-- Add a comment explaining the column should store user_id not email
COMMENT ON COLUMN public.puzzles.created_by IS 'Stores user_id (UUID as text) of the creator, not email. NULL for legacy/admin-created puzzles.';