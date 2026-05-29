import { corsHeaders } from "../_shared/cors.ts";

const TRANSPARENT_PNG = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="),
  (c) => c.charCodeAt(0),
);

function missingResponse() {
  return new Response(TRANSPARENT_PNG, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "image/png", "X-Icon-Status": "missing" },
  });
}

async function resolveJoinEndpoint(code: string): Promise<string | null> {
  try {
    const resp = await fetch(`https://cfx.re/join/${code}`, {
      method: "HEAD",
      redirect: "manual",
    });
    const ep = resp.headers.get("x-citizenfx-url");
    if (!ep) return null;
    return ep.replace(/^https?:\/\//, "").replace(/\/$/, "");
  } catch {
    return null;
  }
}

async function fetchDirectIconPng(endpoint: string): Promise<Uint8Array | null> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 6000);
    const resp = await fetch(`http://${endpoint}/info.json`, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const info = await resp.json();
    const icon = info?.icon;
    if (!icon || typeof icon !== "string") return null;
    return Uint8Array.from(atob(icon), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { serverCode, v } = await req.json().catch(() => ({}));
    if (!serverCode || serverCode === "__healthcheck__" || serverCode === "healthcheck") {
      return new Response(JSON.stringify({ ok: true, healthcheck: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const code = String(serverCode).trim().toLowerCase();

    // Resolve icon version: caller may pass it, otherwise look it up via the
    // single-server endpoint (the /icon/<code>/0.png URL returns 404).
    let version: string | number | null = v ?? null;
    let directEndpoint: string | null = null;
    if (version === null || version === undefined || version === "" || version === 0 || version === "0") {
      try {
        const info = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${code}`);
        if (info.ok) {
          const json = await info.json();
          const data = json?.Data ?? json;
          if (data && typeof data.iconVersion !== "undefined" && data.iconVersion !== null) {
            version = data.iconVersion;
          }
          // Try to discover an endpoint for direct fallback if needed
          const eps: string[] | undefined = data?.connectEndPoints;
          if (Array.isArray(eps) && eps.length > 0) {
            directEndpoint = String(eps[0]).replace(/^https?:\/\//, "").replace(/\/$/, "");
          }
        }
      } catch {
        // ignore, fall through to direct fallback
      }
    }

    // Try the master server icon URL first
    if (version !== null && version !== undefined && version !== "") {
      const url = `https://servers-frontend.fivem.net/api/servers/icon/${code}/${version}.png`;
      const upstream = await fetch(url);
      if (upstream.ok) {
        const buf = await upstream.arrayBuffer();
        if (buf.byteLength > 100) {
          return new Response(buf, {
            headers: {
              ...corsHeaders,
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      }
    }

    // Fallback: resolve via cfx.re/join header → direct /info.json → embedded base64 icon
    if (!directEndpoint) {
      directEndpoint = await resolveJoinEndpoint(code);
    }
    if (directEndpoint) {
      const png = await fetchDirectIconPng(directEndpoint);
      if (png && png.byteLength > 100) {
        return new Response(png, {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
            "X-Icon-Source": "direct",
          },
        });
      }
    }

    return missingResponse();
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

