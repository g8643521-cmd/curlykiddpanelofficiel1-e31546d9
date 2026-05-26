import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const DISCORD_API = "https://discord.com/api/v10";
const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- Discord helpers ----------
async function discord(
  path: string,
  init: RequestInit = {},
): Promise<any> {
  if (!BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN is not configured");
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (res.status === 204) return null;
  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  if (!res.ok) {
    const msg = typeof parsed === "object" && parsed?.message
      ? `Discord ${res.status}: ${parsed.message}${parsed.code ? ` (code ${parsed.code})` : ""}`
      : `Discord ${res.status}: ${text || res.statusText}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.discord = parsed;
    throw err;
  }
  return parsed;
}

// ---------- Presets ----------
type PresetChannel = { name: string; whName: string; target: string };
type Preset = {
  key: string;
  label: string;
  category: string;
  channels: PresetChannel[];
};

const PRESETS: Preset[] = [
  {
    key: "complete",
    label: "Complete (alerts + scans + manual)",
    category: "🛡️ CurlyKidd Panel",
    channels: [
      { name: "🚨-cheater-alerts", whName: "Cheater Alerts", target: "webhook_url" },
      { name: "🔍-manual-scans", whName: "Manual Scans", target: "manual_webhook_url" },
      { name: "⚙️-auto-scans", whName: "Auto Scans", target: "auto_scan_webhook_url" },
      { name: "📋-full-scans", whName: "Full Scans", target: "full_scan_webhook_url" },
    ],
  },
  {
    key: "alerts-only",
    label: "Alerts only",
    category: "🛡️ CurlyKidd Alerts",
    channels: [
      { name: "🚨-cheater-alerts", whName: "Cheater Alerts", target: "webhook_url" },
    ],
  },
  {
    key: "scans",
    label: "Scan logs",
    category: "🔍 CurlyKidd Scans",
    channels: [
      { name: "🔍-manual-scans", whName: "Manual Scans", target: "manual_webhook_url" },
      { name: "⚙️-auto-scans", whName: "Auto Scans", target: "auto_scan_webhook_url" },
      { name: "📋-full-scans", whName: "Full Scans", target: "full_scan_webhook_url" },
    ],
  },
];

// ---------- Auth helper ----------
async function getUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth) throw new Error("Unauthorized");
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return data.user;
}

// ---------- Action handlers ----------
async function listGuilds() {
  const guilds = await discord("/users/@me/guilds");
  return {
    guilds: (guilds || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
    })),
  };
}

async function listRoles(guildId: string) {
  const roles = await discord(`/guilds/${guildId}/roles`);
  return {
    roles: (roles || [])
      .filter((r: any) => r.name !== "@everyone")
      .sort((a: any, b: any) => b.position - a.position)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        position: r.position,
      })),
  };
}

async function getBotUserId(): Promise<string> {
  const me = await discord("/users/@me");
  return me.id;
}

async function createSetup(args: {
  userId: string;
  guildId: string;
  presetKey: string;
  visibility: "public" | "private";
  allowedRoleIds: string[];
  admin: any;
}) {
  const preset = PRESETS.find((p) => p.key === args.presetKey);
  if (!preset) throw new Error(`Unknown preset: ${args.presetKey}`);

  // Build permission overwrites for the category
  let overwrites: any[] | undefined;
  if (args.visibility === "private") {
    overwrites = [
      // Deny @everyone (guild_id is the role id of @everyone)
      { id: args.guildId, type: 0, allow: "0", deny: "1024" }, // VIEW_CHANNEL = 1024
      // Allow each selected role
      ...args.allowedRoleIds.map((id) => ({
        id, type: 0, allow: "1024", deny: "0",
      })),
    ];
  }

  // 1) Create the category (channel type 4)
  const category = await discord(`/guilds/${args.guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name: preset.category,
      type: 4,
      permission_overwrites: overwrites,
    }),
  });

  const createdChannels: any[] = [];
  // 2) Create each text channel (type 0) under the category
  for (const ch of preset.channels) {
    const channel = await discord(`/guilds/${args.guildId}/channels`, {
      method: "POST",
      body: JSON.stringify({
        name: ch.name,
        type: 0,
        parent_id: category.id,
        // Inherit category perms by passing same overwrites (or undefined to sync)
        permission_overwrites: overwrites,
      }),
    });

    // 3) Create a webhook on the channel
    const webhook = await discord(`/channels/${channel.id}/webhooks`, {
      method: "POST",
      body: JSON.stringify({ name: ch.whName }),
    });

    createdChannels.push({
      channel_id: channel.id,
      channel_name: ch.name,
      webhook_id: webhook.id,
      webhook_url: `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`,
      wh_name: ch.whName,
      target: ch.target,
    });
  }

  const setupKey = `${args.guildId}:${category.id}`;

  // Persist
  const { error: insErr } = await args.admin.from("discord_auto_setups").insert({
    setup_key: setupKey,
    user_id: args.userId,
    guild_id: args.guildId,
    category_id: category.id,
    category_name: preset.category,
    preset: preset.key,
    visibility: args.visibility,
    allowed_role_ids: args.allowedRoleIds,
    channels: createdChannels,
  });
  if (insErr) throw new Error(`DB insert failed: ${insErr.message}`);

  return {
    setup: {
      key: setupKey,
      guild_id: args.guildId,
      category_id: category.id,
      category_name: preset.category,
      preset: preset.key,
      visibility: args.visibility,
      allowed_role_ids: args.allowedRoleIds,
      channels: createdChannels,
      created_at: new Date().toISOString(),
    },
  };
}

async function listSetups(userId: string, admin: any, isAdmin: boolean) {
  const q = admin
    .from("discord_auto_setups")
    .select("*")
    .order("created_at", { ascending: false });
  const { data, error } = isAdmin ? await q : await q.eq("user_id", userId);
  if (error) throw new Error(error.message);
  return {
    setups: (data || []).map((s: any) => ({
      key: s.setup_key,
      guild_id: s.guild_id,
      category_id: s.category_id,
      category_name: s.category_name,
      preset: s.preset,
      visibility: s.visibility,
      allowed_role_ids: s.allowed_role_ids || [],
      channels: s.channels || [],
      created_at: s.created_at,
    })),
  };
}

async function testSetup(setupKey: string, userId: string, admin: any, isAdmin: boolean) {
  const { data: row, error } = await admin
    .from("discord_auto_setups")
    .select("*")
    .eq("setup_key", setupKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Setup not found");
  if (!isAdmin && row.user_id !== userId) throw new Error("Forbidden");

  const channels = row.channels || [];
  const results = await Promise.allSettled(
    channels.map((ch: any) =>
      fetch(ch.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `✅ Test message from CurlyKidd Panel — channel **${ch.channel_name}** is connected.`,
        }),
      }).then((r) => {
        if (!r.ok) throw new Error(`${ch.channel_name}: ${r.status}`);
        return ch.channel_name;
      }),
    ),
  );
  const errors = results
    .filter((r) => r.status === "rejected")
    .map((r: any) => String(r.reason?.message || r.reason));
  return { sent: results.length - errors.length, total: results.length, errors };
}

async function deleteSetup(setupKey: string, userId: string, admin: any, isAdmin: boolean) {
  const { data: row, error } = await admin
    .from("discord_auto_setups")
    .select("*")
    .eq("setup_key", setupKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Setup not found");
  if (!isAdmin && row.user_id !== userId) throw new Error("Forbidden");

  const errors: string[] = [];
  let removedWebhooks = 0;
  let removedChannels = 0;

  for (const ch of row.channels || []) {
    try {
      await discord(`/webhooks/${ch.webhook_id}`, { method: "DELETE" });
      removedWebhooks++;
    } catch (e: any) {
      if (e.status !== 404) errors.push(`webhook ${ch.webhook_id}: ${e.message}`);
      else removedWebhooks++;
    }
    try {
      await discord(`/channels/${ch.channel_id}`, { method: "DELETE" });
      removedChannels++;
    } catch (e: any) {
      if (e.status !== 404) errors.push(`channel ${ch.channel_id}: ${e.message}`);
      else removedChannels++;
    }
  }

  try {
    await discord(`/channels/${row.category_id}`, { method: "DELETE" });
  } catch (e: any) {
    if (e.status !== 404) errors.push(`category ${row.category_id}: ${e.message}`);
  }

  const { error: delErr } = await admin
    .from("discord_auto_setups")
    .delete()
    .eq("setup_key", setupKey);
  if (delErr) errors.push(`db: ${delErr.message}`);

  return { removedChannels, removedWebhooks, errors };
}

// ---------- Entry ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!BOT_TOKEN) {
      return json({ error: "DISCORD_BOT_TOKEN is not configured on the server" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // 'presets' is harmless and doesn't need auth — but we still require auth for consistency
    const user = await getUser(req);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check admin role
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = (roleRows || []).some((r: any) =>
      r.role === "admin" || r.role === "owner"
    );

    switch (action) {
      case "presets":
        return json({ presets: PRESETS });

      case "list-guilds":
        return json(await listGuilds());

      case "list-roles": {
        if (!body.guild_id) return json({ error: "guild_id required" }, 400);
        return json(await listRoles(body.guild_id));
      }

      case "list-setups":
        return json(await listSetups(user.id, admin, isAdmin));

      case "create": {
        if (!body.guild_id || !body.preset) {
          return json({ error: "guild_id and preset required" }, 400);
        }
        const result = await createSetup({
          userId: user.id,
          guildId: body.guild_id,
          presetKey: body.preset,
          visibility: body.visibility === "private" ? "private" : "public",
          allowedRoleIds: Array.isArray(body.allowed_role_ids) ? body.allowed_role_ids : [],
          admin,
        });
        return json(result);
      }

      case "test-setup": {
        if (!body.setup_key) return json({ error: "setup_key required" }, 400);
        return json(await testSetup(body.setup_key, user.id, admin, isAdmin));
      }

      case "delete": {
        if (!body.setup_key) return json({ error: "setup_key required" }, 400);
        return json(await deleteSetup(body.setup_key, user.id, admin, isAdmin));
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    console.error("discord-webhook-setup error:", e);
    const status = e.message === "Unauthorized" ? 401 : 500;
    return json({ error: e.message || "Internal error" }, status);
  }
});
