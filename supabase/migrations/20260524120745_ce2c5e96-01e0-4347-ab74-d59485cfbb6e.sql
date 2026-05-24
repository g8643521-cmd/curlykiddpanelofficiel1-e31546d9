
-- 1) Attach trigger to enforce that users cannot escalate their own role/status on profiles
DROP TRIGGER IF EXISTS protect_profile_moderation_fields ON public.profiles;
CREATE TRIGGER protect_profile_moderation_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_moderation_fields();

-- 2) Tighten activity_log anonymous INSERT: force null ip/user_agent and limit to safe categories/severity
DROP POLICY IF EXISTS "Anonymous can insert activity" ON public.activity_log;
CREATE POLICY "Anonymous can insert activity"
ON public.activity_log
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND ip_address IS NULL
  AND user_agent IS NULL
  AND severity = 'info'
  AND category IN ('page_view', 'navigation', 'public')
);

-- 3) Tighten visitor_logs anonymous INSERT: disallow client-supplied ip and user_agent
DROP POLICY IF EXISTS "Anonymous insert visitor logs" ON public.visitor_logs;
CREATE POLICY "Anonymous insert visitor logs"
ON public.visitor_logs
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND ip_address IS NULL
  AND user_agent IS NULL
);
