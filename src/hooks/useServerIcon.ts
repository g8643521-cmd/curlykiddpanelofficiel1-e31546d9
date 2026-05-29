import { useEffect, useState } from "react";

const ICON_CACHE_TTL = 1000 * 60 * 60;
const MISSING_ICON_CACHE_TTL = 1000 * 30;

type IconCacheEntry = {
  url: string | null;
  expiresAt: number;
};

const iconCache = new Map<string, IconCacheEntry>();
const inFlightRequests = new Map<string, Promise<string | null>>();

const getCacheKey = (serverCode: string, version?: number | string | null) => {
  const normalizedCode = serverCode.trim().toLowerCase();
  return version === undefined || version === null || version === "" ? normalizedCode : `${normalizedCode}:${version}`;
};

const getCachedIcon = (serverCode: string, version?: number | string | null) => {
  const key = getCacheKey(serverCode, version);
  const cached = iconCache.get(key);

  if (!cached) return undefined;

  if (cached.expiresAt <= Date.now()) {
    if (cached.url) URL.revokeObjectURL(cached.url);
    iconCache.delete(key);
    return undefined;
  }

  return cached.url;
};

const setCachedIcon = (serverCode: string, url: string | null, version?: number | string | null) => {
  iconCache.set(getCacheKey(serverCode, version), {
    url,
    expiresAt: Date.now() + (url ? ICON_CACHE_TTL : MISSING_ICON_CACHE_TTL),
  });
};

const fetchServerIcon = async (serverCode: string, version?: number | null) => {
  const cached = getCachedIcon(serverCode, version);
  if (cached !== undefined) return cached;

  const key = getCacheKey(serverCode, version);
  const existingRequest = inFlightRequests.get(key);
  if (existingRequest) return existingRequest;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const request = fetch(`${supabaseUrl}/functions/v1/cfx-icon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      serverCode,
      ...(version !== undefined && version !== null ? { v: version } : {}),
    }),
  })
    .then(async (resp) => {
      const contentType = resp.headers.get("content-type") || "";
      if (!contentType.includes("image")) {
        setCachedIcon(serverCode, null, version);
        return null;
      }

      const blob = await resp.blob();
      if (blob.size < 100) {
        setCachedIcon(serverCode, null, version);
        return null;
      }

      const url = URL.createObjectURL(blob);
      setCachedIcon(serverCode, url, version);
      return url;
    })
    .catch(() => {
      setCachedIcon(serverCode, null, version);
      return null;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, request);
  return request;
};

export const prefetchServerIcon = (serverCode?: string | null, version?: number | null) => {
  if (!serverCode) return Promise.resolve(null);
  return fetchServerIcon(serverCode, version);
};

export const useServerIcon = (
  serverCode?: string | null,
  version?: number | null,
  overrideUrl?: string | null,
) => {
  const [iconUrl, setIconUrl] = useState<string | null>(() => {
    if (overrideUrl) return overrideUrl;
    if (!serverCode) return null;
    return getCachedIcon(serverCode, version) ?? null;
  });
  const [iconLoading, setIconLoading] = useState(() => {
    if (overrideUrl) return false;
    if (!serverCode) return false;
    return getCachedIcon(serverCode, version) === undefined;
  });
  const [iconError, setIconError] = useState(false);

  useEffect(() => {
    if (overrideUrl) {
      setIconUrl(overrideUrl);
      setIconLoading(false);
      setIconError(false);
      return;
    }
    if (!serverCode) {
      setIconUrl(null);
      setIconLoading(false);
      setIconError(false);
      return;
    }

    const cached = getCachedIcon(serverCode, version);
    if (cached !== undefined) {
      setIconUrl(cached);
      setIconLoading(false);
      setIconError(cached === null);
      return;
    }

    let isCancelled = false;

    setIconLoading(true);
    setIconError(false);

    fetchServerIcon(serverCode, version)
      .then((url) => {
        if (isCancelled) return;
        setIconUrl(url);
        setIconError(!url);
      })
      .finally(() => {
        if (isCancelled) return;
        setIconLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [serverCode, version, overrideUrl]);

  return {
    iconUrl,
    iconLoading,
    iconError,
  };
};