
-- 1. audit_log: prevent log spoofing of ip_address/user_agent
DROP POLICY IF EXISTS "Users can insert own audit entries" ON public.audit_log;
CREATE POLICY "Users can insert own audit entries"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND ip_address IS NULL AND user_agent IS NULL);

-- 2. discord_alerted_members: add explicit UPDATE/DELETE policies for guild owners and admins
CREATE POLICY "Guild owners or admins can update alerted members"
ON public.discord_alerted_members FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.discord_bot_servers s
    WHERE s.guild_id = discord_alerted_members.guild_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Guild owners or admins can delete alerted members"
ON public.discord_alerted_members FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.discord_bot_servers s
    WHERE s.guild_id = discord_alerted_members.guild_id AND s.user_id = auth.uid()
  )
);

-- 3. discord_member_joins: explicitly deny client-side writes (service role bypasses RLS).
CREATE POLICY "Block client inserts on member joins"
ON public.discord_member_joins FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "Block client updates on member joins"
ON public.discord_member_joins FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "Block client deletes on member joins"
ON public.discord_member_joins FOR DELETE TO authenticated
USING (false);

-- 4. server_shares: verify the inserting user actually owns the referenced server
DROP POLICY IF EXISTS "Users can create shares" ON public.server_shares;
CREATE POLICY "Users can create shares"
ON public.server_shares FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = shared_by
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.discord_bot_servers s
      WHERE s.id::text = server_shares.server_id AND s.user_id = auth.uid()
    )
  )
);
