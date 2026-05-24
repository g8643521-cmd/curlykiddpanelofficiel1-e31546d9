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
    if (version === null || version === undefined || version === "" || version === 0 || version === "0") {
      try {
        const info = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${code}`);
        if (info.ok) {
          const json = await info.json();
          const data = json?.Data ?? json;
          if (data && typeof data.iconVersion !== "undefined" && data.iconVersion !== null) {
            version = data.iconVersion;
          }
        }
      } catch {
        // ignore, fall through to missing
      }
    }

    if (version === null || version === undefined || version === "") {
      return missingResponse();
    }

    const url = `https://servers-frontend.fivem.net/api/servers/icon/${code}/${version}.png`;
    const upstream = await fetch(url);

    if (!upstream.ok) return missingResponse();

    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
