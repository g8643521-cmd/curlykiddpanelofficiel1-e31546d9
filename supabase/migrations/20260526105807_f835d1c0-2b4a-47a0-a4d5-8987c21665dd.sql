CREATE TABLE public.discord_auto_setups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setup_key TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  guild_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  preset TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public',
  allowed_role_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discord_auto_setups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins view setups" ON public.discord_auto_setups
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners and admins insert setups" ON public.discord_auto_setups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners and admins update setups" ON public.discord_auto_setups
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners and admins delete setups" ON public.discord_auto_setups
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_discord_auto_setups_user ON public.discord_auto_setups(user_id);
CREATE INDEX idx_discord_auto_setups_guild ON public.discord_auto_setups(guild_id);

CREATE TRIGGER update_discord_auto_setups_updated_at
  BEFORE UPDATE ON public.discord_auto_setups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();