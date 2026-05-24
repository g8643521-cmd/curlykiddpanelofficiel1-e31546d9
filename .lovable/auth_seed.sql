INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous) VALUES
('7c811fdf-74ed-4711-ab11-b0b02d37da04','00000000-0000-0000-0000-000000000000','g8643521@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('e50f803d-d56f-4c1e-826a-4439da3fe3ac','00000000-0000-0000-0000-000000000000','fimse123125@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('3645e74e-5409-4f85-9c5e-c4d97fa225fb','00000000-0000-0000-0000-000000000000','williene.mangione@mailmagnet.co',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('559050c5-6228-40e2-8ee3-a0f8dd80be8c','00000000-0000-0000-0000-000000000000','tarla.howse@mailmagnet.co',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('e469b011-33ed-4a96-83f2-438358d85b6c','00000000-0000-0000-0000-000000000000','dwagga460@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('10291158-1b04-47f9-a5b6-bee46c9fded2','00000000-0000-0000-0000-000000000000','archived-10291158@deleted.local',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('867e2b4b-78c5-4e74-b5a9-0b3c79356a16','00000000-0000-0000-0000-000000000000','archived-867e2b4b@deleted.local',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('22f0f1c8-38f5-4f81-8d6c-cb32962a6ba4','00000000-0000-0000-0000-000000000000','ludwig69420@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('d06dd298-63f0-4a53-8cff-450b4b00b9d3','00000000-0000-0000-0000-000000000000','trineelbaek1978@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('12f97805-536b-4caf-a148-f78bf426b80c','00000000-0000-0000-0000-000000000000','wriismalthe@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('5f84f1a9-d82f-4aa2-aa0d-0913ccdabc2c','00000000-0000-0000-0000-000000000000','oliverbjerrehuus1@atomicmail.io',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('71d8cd0a-b5ef-4a95-a429-696da8b7bfee','00000000-0000-0000-0000-000000000000','jeffbumbum8@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('c76cbc18-8265-4f29-8be0-527382b11908','00000000-0000-0000-0000-000000000000','omms43109@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('5f8d03bf-5f67-428f-833d-a9ce0055759e','00000000-0000-0000-0000-000000000000','oliver514254134@atomicmail.io',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('dedd90ed-babb-4c9d-81b2-5bd8edea4460','00000000-0000-0000-0000-000000000000','youn252500@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false),
('bf3dc9bb-56d2-4b91-b117-f25537031595','00000000-0000-0000-0000-000000000000','younggungg2@gmail.com',crypt(gen_random_uuid()::text, gen_salt('bf')),now(),now(),now(),'authenticated','authenticated','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false)
ON CONFLICT (id) DO NOTHING;UPDATE public.admin_settings SET value='true' WHERE key IN ('auth_show_email','auth_show_signup','auth_show_google');
UPDATE public.admin_settings SET value='false' WHERE key='auth_show_discord';
INSERT INTO public.admin_settings (key, value) VALUES
  ('auth_show_discord','true'),
  ('auth_show_google','false'),
  ('auth_show_email','true'),
  ('auth_show_signup','true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
UPDATE auth.users SET email_change_token_new = '' WHERE email_change_token_new IS NULL;
UPDATE auth.users SET email_change_token_current = '' WHERE email_change_token_current IS NULL;
UPDATE auth.users SET recovery_token = '' WHERE recovery_token IS NULL;
UPDATE auth.users SET phone_change = '' WHERE phone_change IS NULL;
UPDATE auth.users SET phone_change_token = '' WHERE phone_change_token IS NULL;
UPDATE auth.users SET reauthentication_token = '' WHERE reauthentication_token IS NULL;CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'owner'::public.app_role)
$$;

DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Admins and owners can manage settings"
ON public.admin_settings
FOR ALL
TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
CREATE POLICY "Users can view own profile, admins and owners view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins and owners can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins and owners can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins and owners can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins and owners can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins and owners can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;
CREATE POLICY "Admins and owners can view audit log"
ON public.audit_log
FOR SELECT
TO authenticated
USING (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_log;
CREATE POLICY "Admins and owners can view all activity"
ON public.activity_log
FOR SELECT
TO authenticated
USING (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete activity" ON public.activity_log;
CREATE POLICY "Admins and owners can delete activity"
ON public.activity_log
FOR DELETE
TO authenticated
USING (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage system webhooks" ON public.system_webhooks;
CREATE POLICY "Admins and owners can manage system webhooks"
ON public.system_webhooks
FOR ALL
TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage bot config" ON public.discord_bot_config;
CREATE POLICY "Admins and owners can manage bot config"
ON public.discord_bot_config
FOR ALL
TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can read bot config" ON public.discord_bot_config;
CREATE POLICY "Admins and owners can read bot config"
ON public.discord_bot_config
FOR SELECT
TO authenticated
USING (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can view visitor logs" ON public.visitor_logs;
CREATE POLICY "Admins and owners can view visitor logs"
ON public.visitor_logs
FOR SELECT
TO authenticated
USING (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can update mods" ON public.fivem_mods;
CREATE POLICY "Admins and owners can update mods"
ON public.fivem_mods
FOR UPDATE
TO authenticated
USING (public.has_admin_access(auth.uid()))
WITH CHECK (public.has_admin_access(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete mods" ON public.fivem_mods;
CREATE POLICY "Admins and owners can delete mods"
ON public.fivem_mods
FOR DELETE
TO authenticated
USING (public.has_admin_access(auth.uid()));CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin'::public.app_role AND role = 'owner'::public.app_role)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.has_admin_access(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_admin_access(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_admin_access(uuid) TO authenticated;ALTER TABLE public.server_favorites
  ADD COLUMN IF NOT EXISTS server_code TEXT;

UPDATE public.server_favorites
SET server_code = COALESCE(server_code, server_id)
WHERE server_code IS NULL;

ALTER TABLE public.cheater_reports
  ADD COLUMN IF NOT EXISTS player_name TEXT,
  ADD COLUMN IF NOT EXISTS player_identifiers JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS server_code TEXT,
  ADD COLUMN IF NOT EXISTS server_name TEXT,
  ADD COLUMN IF NOT EXISTS evidence_url TEXT;

UPDATE public.cheater_reports
SET
  player_name = COALESCE(player_name, NULLIF(reported_user, ''), 'Unknown player'),
  evidence_url = COALESCE(evidence_url, evidence),
  player_identifiers = COALESCE(player_identifiers, '{}'::jsonb)
WHERE player_name IS NULL OR evidence_url IS NULL OR player_identifiers IS NULL;

ALTER TABLE public.cheater_reports
  ALTER COLUMN player_identifiers SET DEFAULT '{}'::jsonb;

DROP POLICY IF EXISTS "Users can view own reports" ON public.cheater_reports;
DROP POLICY IF EXISTS "Staff and public can view cheater reports" ON public.cheater_reports;
CREATE POLICY "Staff and public can view cheater reports"
ON public.cheater_reports
FOR SELECT
TO authenticated
USING (
  status IN ('confirmed', 'suspected')
  OR auth.uid() = reporter_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
);

DROP POLICY IF EXISTS "Admins and moderators can update cheater reports" ON public.cheater_reports;
CREATE POLICY "Admins and moderators can update cheater reports"
ON public.cheater_reports
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
);

DROP POLICY IF EXISTS "Admins and moderators can delete cheater reports" ON public.cheater_reports;
CREATE POLICY "Admins and moderators can delete cheater reports"
ON public.cheater_reports
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
);

CREATE OR REPLACE FUNCTION public.get_cheater_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', count(*)::int,
    'confirmed', count(*) FILTER (WHERE status = 'confirmed')::int,
    'suspected', count(*) FILTER (WHERE status = 'suspected')::int
  )
  FROM public.cheater_reports
  WHERE status IN ('confirmed', 'suspected');
$$;ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discord_guild_member boolean,
ADD COLUMN IF NOT EXISTS discord_guild_checked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS discord_guild_status text;

CREATE INDEX IF NOT EXISTS idx_profiles_discord_user_id
ON public.profiles (discord_user_id)
WHERE discord_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_discord_guild_member
ON public.profiles (discord_guild_member);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT INSERT ON TABLE public.profiles TO authenticated;
GRANT UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;

GRANT SELECT (
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  email,
  discord_user_id,
  discord_username,
  discord_avatar,
  banner_url,
  discord_guild_member,
  discord_guild_status,
  discord_guild_checked_at,
  theme,
  badges,
  level,
  xp,
  role,
  status,
  flagged_at,
  flagged_reason,
  suspended_at,
  suspended_reason,
  risk_score,
  created_at,
  updated_at
) ON public.profiles TO authenticated;

GRANT INSERT (
  user_id,
  display_name,
  avatar_url,
  bio,
  email,
  discord_user_id,
  discord_username,
  discord_avatar,
  banner_url,
  discord_guild_member,
  discord_guild_status,
  discord_guild_checked_at,
  theme,
  badges,
  level,
  xp
) ON public.profiles TO authenticated;

GRANT UPDATE (
  display_name,
  avatar_url,
  bio,
  email,
  discord_user_id,
  discord_username,
  discord_avatar,
  banner_url,
  discord_guild_member,
  discord_guild_status,
  discord_guild_checked_at,
  theme,
  badges,
  level,
  xp,
  updated_at
) ON public.profiles TO authenticated;

GRANT SELECT (
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  discord_user_id,
  discord_username,
  discord_avatar,
  banner_url,
  discord_guild_member,
  discord_guild_status,
  discord_guild_checked_at,
  theme,
  badges,
  level,
  xp,
  role,
  status,
  created_at,
  updated_at
) ON public.profiles TO anon;
-- Public lookup of bot-detected cheaters by Discord ID
CREATE OR REPLACE FUNCTION public.public_lookup_bot_cheater(_discord_id text)
RETURNS TABLE(
  discord_user_id text,
  discord_username text,
  discord_avatar text,
  guild_id text,
  guild_name text,
  total_bans int,
  total_tickets int,
  is_flagged boolean,
  summary_text text,
  detected_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.discord_user_id,
    b.discord_username,
    b.discord_avatar,
    b.guild_id,
    b.guild_name,
    COALESCE(b.total_bans, 0),
    COALESCE(b.total_tickets, 0),
    COALESCE(b.is_flagged, false),
    b.summary_text,
    b.detected_at
  FROM public.bot_detected_cheaters b
  WHERE b.discord_user_id = _discord_id
  ORDER BY b.detected_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.public_lookup_bot_cheater(text) TO anon, authenticated;

-- Update stats to also count bot-detected cheaters
CREATE OR REPLACE FUNCTION public.get_cheater_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH r AS (
    SELECT
      count(*)::int AS total_r,
      count(*) FILTER (WHERE status = 'confirmed')::int AS confirmed_r,
      count(*) FILTER (WHERE status = 'suspected')::int AS suspected_r
    FROM public.cheater_reports
    WHERE status IN ('confirmed', 'suspected')
  ),
  b AS (
    SELECT
      count(DISTINCT discord_user_id)::int AS total_b,
      count(DISTINCT discord_user_id) FILTER (WHERE is_flagged = true OR COALESCE(total_bans, 0) > 0)::int AS flagged_b
    FROM public.bot_detected_cheaters
    WHERE discord_user_id IS NOT NULL
  )
  SELECT jsonb_build_object(
    'total', (SELECT total_r FROM r) + (SELECT total_b FROM b),
    'confirmed', (SELECT confirmed_r FROM r) + (SELECT flagged_b FROM b),
    'suspected', (SELECT suspected_r FROM r) + ((SELECT total_b FROM b) - (SELECT flagged_b FROM b))
  );
$$;
CREATE OR REPLACE FUNCTION public.get_login_social_proof()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'avatars', COALESCE((
      SELECT jsonb_agg(a) FROM (
        SELECT COALESCE(p.avatar_url, p.discord_avatar) AS a
        FROM public.profiles p
        WHERE COALESCE(p.avatar_url, p.discord_avatar) IS NOT NULL
          AND COALESCE(p.status, 'active') = 'active'
        ORDER BY p.created_at DESC
        LIMIT 5
      ) s
    ), '[]'::jsonb),
    'joined_this_week', (
      SELECT COUNT(*)::int
      FROM public.profiles
      WHERE created_at > now() - interval '7 days'
        AND COALESCE(status, 'active') = 'active'
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_login_social_proof() TO anon, authenticated;-- 1. activity_log: restrict anonymous inserts to safe fields only
DROP POLICY IF EXISTS "Anonymous can insert activity" ON public.activity_log;
CREATE POLICY "Anonymous can insert activity"
  ON public.activity_log
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND user_email IS NULL
    AND user_display_name IS NULL
    AND severity = 'info'
    AND category IN ('page_view', 'visitor')
  );

-- 2. discord_bot_servers: hide webhook columns at the column-privilege level.
--    Owners/admins read them via the existing SECURITY DEFINER RPCs
--    (get_server_webhooks / get_my_server_webhooks).
REVOKE SELECT (webhook_url, manual_webhook_url, auto_scan_webhook_url, full_scan_webhook_url)
  ON public.discord_bot_servers FROM anon, authenticated;

-- 3a. fivem_mods: only expose published mods to the public
DROP POLICY IF EXISTS "Anyone can view mods" ON public.fivem_mods;
CREATE POLICY "Anyone can view published mods"
  ON public.fivem_mods
  FOR SELECT
  TO public
  USING (status = 'published');

-- 3b. fivem_mods: allow authors to delete their own uploads
CREATE POLICY "Uploaders can delete own mods"
  ON public.fivem_mods
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- 4. server_creation_keys: hide expired keys from recipients
DROP POLICY IF EXISTS "Users can view own unused keys" ON public.server_creation_keys;
CREATE POLICY "Users can view own unused keys"
  ON public.server_creation_keys
  FOR SELECT
  TO authenticated
  USING (
    issued_to = auth.uid()
    AND used_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  );