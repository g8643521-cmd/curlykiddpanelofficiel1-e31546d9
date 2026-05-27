-- activity_log: forbid client-supplied ip/user_agent on authenticated inserts
DROP POLICY IF EXISTS "Authenticated can insert activity" ON public.activity_log;
CREATE POLICY "Authenticated can insert activity"
  ON public.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND ip_address IS NULL
    AND user_agent IS NULL
  );

-- visitor_logs: forbid client-supplied ip/user_agent on authenticated inserts
DROP POLICY IF EXISTS "Authenticated insert own visitor logs" ON public.visitor_logs;
CREATE POLICY "Authenticated insert own visitor logs"
  ON public.visitor_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND ip_address IS NULL
    AND user_agent IS NULL
  );