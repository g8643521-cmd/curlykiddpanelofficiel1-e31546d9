const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const cleanCode = (value: unknown) => String(value || "").replace(/[^a-zA-Z0-9]/g, "").trim();

// Detect raw ip:port — supports IPv4 and bracketed IPv6
const parseIpPort = (raw: string): { host: string; port: number } | null => {
  const s = raw.trim();
  // bracketed IPv6 [::1]:30120
  const v6 = s.match(/^\[([^\]]+)\]:(\d{2,5})$/);
  if (v6) return { host: v6[1], port: Number(v6[2]) };
  // ipv4:port or host:port
  const m = s.match(/^([a-zA-Z0-9.\-]+):(\d{2,5})$/);
  if (m && !/^[a-zA-Z0-9]+$/.test(s)) return { host: m[1], port: Number(m[2]) };
  return null;
};

const shapeFromInfoDynamic = (info: any, dynamic: any, host: string, port: number) => {
  const vars = info?.vars || {};
  return {
    success: true,
    direct: true,
    hostname: dynamic?.hostname || vars.sv_projectName || `${host}:${port}`,
    players: Array.isArray(dynamic?.players) ? dynamic.players : [],
    playerCount: Number(dynamic?.clients ?? 0),
    maxPlayers: Number(dynamic?.sv_maxclients || vars.sv_maxClients || 0),
    resources: Array.isArray(info?.resources) ? info.resources : [],
    server: `${host}:${port}`,
    vars,
    ip: host,
    port,
    iconVersion: info?.icon ? 1 : null,
    ownerName: null,
    ownerProfile: null,
    ownerAvatar: null,
    enhancedHostSupport: !!vars.sv_enhancedHostSupport,
    private: false,
    projectName: vars.sv_projectName || null,
    projectDesc: vars.sv_projectDesc || null,
    tags: vars.tags || "",
    locale: vars.locale || null,
    licenseKeyToken: null,
    premiumTier: vars.premium || null,
    banner: vars.banner_detail || vars.banner_connecting || null,
    gametype: dynamic?.gametype || vars.gametype || null,
    mapname: dynamic?.mapname || vars.mapname || null,
  };
};

const tryDirect = async (host: string, port: number) => {
  const base = `http://${host}:${port}`;
  try {
    const [infoRes, dynRes] = await Promise.all([
      fetch(`${base}/info.json`, { signal: AbortSignal.timeout(7000) }),
      fetch(`${base}/dynamic.json`, { signal: AbortSignal.timeout(7000) }),
    ]);
    if (!infoRes.ok || !dynRes.ok) return null;
    const info = await infoRes.json().catch(() => null);
    const dynamic = await dynRes.json().catch(() => null);
    if (!info || !dynamic) return null;
    return shapeFromInfoDynamic(info, dynamic, host, port);
  } catch {
    return null;
  }
};

const fetchUpstream = async (serverCode: string) => {
  // Retry once with browser-like headers to dodge transient 5xx / cache misses
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${serverCode}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (CurlyKiddPanel; +https://curlykiddpanel.lovable.app)",
          Referer: "https://servers.fivem.net/",
        },
        signal: AbortSignal.timeout(9000),
      });
      if (res.status === 404) return { kind: "notfound" as const };
      if (!res.ok) {
        if (attempt === 0) { await new Promise(r => setTimeout(r, 400)); continue; }
        return { kind: "error" as const, status: res.status };
      }
      return { kind: "ok" as const, payload: await res.json() };
    } catch (e) {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 400)); continue; }
      return { kind: "error" as const, status: 0, message: (e as Error)?.message };
    }
  }
  return { kind: "error" as const, status: 0 };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawInput = String(body.serverCode || body.code || body.query || "").trim();
    if (rawInput.toLowerCase() === "healthcheck" || body?.healthcheck) return json({ ok: true, healthcheck: true });

    // 1) Direct ip:port lookup if user supplied one
    const direct = parseIpPort(rawInput);
    if (direct) {
      const result = await tryDirect(direct.host, direct.port);
      if (result) return json(result);
      return json({
        success: false,
        error: `Could not reach ${direct.host}:${direct.port} directly`,
        notFound: true,
        unlisted: true,
      });
    }

    const serverCode = cleanCode(rawInput);
    if (!serverCode) return json({ success: false, error: "Valid serverCode is required", invalid: true });

    const upstream = await fetchUpstream(serverCode);

    if (upstream.kind === "notfound") {
      return json({
        success: false,
        error: "Server not listed in FiveM master list",
        notFound: true,
        unlisted: true,
        hint: "The server may be private/whitelisted, offline, or the code is incorrect. You can also enter the server as IP:PORT (e.g. 1.2.3.4:30120) for a direct lookup.",
      });
    }

    if (upstream.kind === "error") {
      return json({
        success: false,
        error: `FiveM upstream error (${upstream.status || "network"})`,
        fallback: true,
        status: upstream.status,
      });
    }

    const payload = upstream.payload;
    const data = payload?.Data || payload?.data || payload;
    const vars = data?.vars || {};
    const endpoints = Array.isArray(data?.connectEndPoints) ? data.connectEndPoints : [];
    const [ip, rawPort] = String(endpoints[0] || "").split(":");

    return json({
      success: true,
      hostname: data?.hostname || data?.sv_projectName || serverCode,
      players: Array.isArray(data?.players) ? data.players : [],
      playerCount: Number(data?.clients ?? 0),
      maxPlayers: Number(data?.sv_maxclients || vars.sv_maxClients || 0),
      resources: Array.isArray(data?.resources) ? data.resources : [],
      server: serverCode,
      vars,
      ip: ip || null,
      port: rawPort ? Number(rawPort) : undefined,
      iconVersion: data?.iconVersion ?? null,
      ownerName: data?.ownerName ?? null,
      ownerProfile: data?.ownerProfile ?? null,
      ownerAvatar: data?.ownerAvatar ?? null,
      enhancedHostSupport: !!data?.enhancedHostSupport,
      private: !!data?.private,
      projectName: vars.sv_projectName || data?.sv_projectName || null,
      projectDesc: vars.sv_projectDesc || null,
      tags: vars.tags || "",
      locale: vars.locale || null,
      licenseKeyToken: data?.licenseKeyToken || null,
      premiumTier: data?.premium || data?.premiumTier || null,
      banner: vars.banner_detail || vars.banner_connecting || null,
      gametype: data?.gametype || vars.gametype || null,
      mapname: data?.mapname || vars.mapname || null,
    });
  } catch (err) {
    return json({ success: false, error: err instanceof Error ? err.message : "Lookup failed", fallback: true });
  }
});
