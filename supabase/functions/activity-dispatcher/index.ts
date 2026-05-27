import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const ANON_CATEGORIES = new Set(["page_view", "navigation", "public"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));

    if (body?.healthcheck) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Resolve user from the caller's JWT (if any). Never trust body.user_id.
    const authHeader = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userDisplayName: string | null = null;

    if (authHeader.toLowerCase().startsWith("bearer ")) {
      const userClient = createClient(url, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data, error } = await userClient.auth.getUser();
      if (!error && data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
        userDisplayName =
          (data.user.user_metadata?.display_name as string | undefined) ??
          (data.user.user_metadata?.full_name as string | undefined) ??
          null;
      }
    }

    const category = typeof body.category === "string" ? body.category : "general";
    const severity = typeof body.severity === "string" ? body.severity : "info";

    // Anonymous callers may only insert benign page-view style events.
    if (!userId) {
      if (!ANON_CATEGORIES.has(category) || severity !== "info") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const row = {
      user_id: userId,
      user_email: userEmail,
      user_display_name: userDisplayName,
      category,
      action: typeof body.action === "string" ? body.action : "unknown",
      description: typeof body.description === "string" ? body.description : null,
      metadata: body.metadata ?? null,
      page_path: typeof body.page_path === "string" ? body.page_path : null,
      // Always derive ip/ua from the actual request — never from the body.
      ip_address: userId ? (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null) : null,
      user_agent: userId ? (req.headers.get("user-agent") ?? null) : null,
      severity,
    };

    const { error } = await admin.from("activity_log").insert(row);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
