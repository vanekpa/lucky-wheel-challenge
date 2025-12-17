-- Add turn_timer setting (0 = disabled, 15/20/30 = seconds)
INSERT INTO public.game_settings (setting_key, setting_value)
VALUES ('turn_timer', '0')
ON CONFLICT (setting_key) DO NOTHING;