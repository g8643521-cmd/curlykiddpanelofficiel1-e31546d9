import { useState, useEffect, useRef, useMemo } from "react";
import {
  Users,
  Globe,
  MapPin,
  Wifi,
  Clock,
  Server,
  Search,
  Copy,
  X,
  Tag,
  EyeOff,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  RefreshCw,
  Download,
  AlertTriangle,
  Info,
  ShieldCheck,
  Eye,
  Lock,
  Unlock,
  Activity,
  Gauge,
  Signal,
  Languages,
  Layers,
  Building2,
  Link2,
  Gamepad2,
  Hash,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ServerData } from "@/hooks/useCfxApi";
import NotificationSettingsDialog from "@/components/NotificationSettingsDialog";

import PlayerRowCompact, { PLAYER_ROW_GRID } from "@/components/PlayerRowCompact";
import CheaterWarningBanner from "@/components/CheaterWarningBanner";
import SensitiveText from "@/components/SensitiveText";
import ServerOwnerCard from "@/components/ServerOwnerCard";
import ResourceExplorer from "@/components/ResourceExplorer";


import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useCheaterDatabase } from "@/hooks/useCheaterDatabase";
import { useServerIcon } from "@/hooks/useServerIcon";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useStreamerMode } from "@/hooks/useStreamerMode";
import { detectAllAntiCheats } from "@/utils/antiCheatDetection";
import { formatDistanceToNow } from "date-fns";
import { GamificationService } from "@/services/gamificationService";


interface ServerDetailsProps {
  data: ServerData;
  serverCode?: string | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  notificationProps?: {
    hasNotification: boolean;
    currentSettings?: {
      notify_online: boolean;
      notify_player_threshold: boolean;
      player_threshold: number;
    };
    permissionGranted: boolean;
    onRequestPermission: () => Promise<boolean>;
    onSave: (options: { notifyOnline: boolean; notifyThreshold: boolean; threshold: number }) => Promise<boolean>;
    onRemove: () => Promise<boolean>;
  };
  lastUpdate?: Date | null;
  isPolling?: boolean;
  onRefresh?: () => void;
}

const ServerDetails = ({ 
  data: rawData,
  serverCode: propServerCode,
  onClose, 
  isFavorite = false, 
  onToggleFavorite,
  notificationProps,
  lastUpdate,
  isPolling,
  onRefresh,
}: ServerDetailsProps) => {
  const [resourceSearch, setResourceSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerSort, setPlayerSort] = useState<"name" | "id" | "ping">("name");
  const [showAllResources, setShowAllResources] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [showAllSideResources, setShowAllSideResources] = useState(false);
  const autoTrackingDone = useRef(false);
  const data = useMemo(
    () => ({
      ...rawData,
      hostname: rawData?.hostname ?? "",
      players: Array.isArray(rawData?.players) ? rawData.players : [],
      resources: Array.isArray(rawData?.resources) ? rawData.resources : [],
      maxPlayers: typeof rawData?.maxPlayers === "number" ? rawData.maxPlayers : 0,
    }),
    [rawData]
  );
  const { isAdmin } = useAdminStatus();
  void isAdmin;
  const { checkPlayersAgainstCheaters, isCheater, fetchCheaters } = useCheaterDatabase();
  const { getVisibility, isLoading: settingsLoading } = useSystemSettings();
  const { isEnabled: streamerMode } = useStreamerMode();
  
  // Settings visibility hook retained for other potential gated UI
  void settingsLoading;
  void getVisibility;
  // Use the passed server code, or extract from license key token as fallback
  const serverCode = propServerCode || data.licenseKeyToken?.split("_")[0] || null;
  const { iconUrl, iconLoading, iconError } = useServerIcon(propServerCode, data.iconVersion, data.iconDataUrl);

  // Check for cheaters among current players - memoize to prevent disappearing on refresh
  const cheaterMatches = useMemo(() => {
    const matches = checkPlayersAgainstCheaters(data.players);
    return matches;
  }, [data.players, checkPlayersAgainstCheaters]);
  
  // Keep stable reference to cheater matches to prevent banner from disappearing during refreshes
  const [stableCheaterMatches, setStableCheaterMatches] = useState(cheaterMatches);
  
  useEffect(() => {
    // Only update stable matches if we have new matches or if matches were cleared intentionally
    if (cheaterMatches.length > 0) {
      setStableCheaterMatches(cheaterMatches);
    }
    // If cheaterMatches becomes empty but we had matches before, keep the old ones
    // This prevents the banner from disappearing during data refresh cycles
  }, [cheaterMatches]);
  
  const serverNameClean = (data.hostname || '').replace(/\^[0-9]/g, '').replace(/~[a-zA-Z]~/g, '');
  
  // Detect anti-cheats from resources (memoized for performance)
  const detectedAntiCheats = useMemo(() => detectAllAntiCheats(data.resources), [data.resources]);


  const filteredResources = data.resources.filter((r) =>
    r.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const displayedResources = showAllResources ? filteredResources : filteredResources.slice(0, 18);

  const sortedPlayers = [...data.players]
    .filter((p) => p.name.toLowerCase().includes(playerSearch.toLowerCase()))
    .sort((a, b) => {
      if (playerSort === "name") return a.name.localeCompare(b.name);
      if (playerSort === "id") return a.id - b.id;
      return a.ping - b.ping;
    });

  const effectivePlayerCount = data.players.length > 0 ? data.players.length : (data.playerCount ?? 0);

  const playerPercentage = data.maxPlayers > 0 ? (effectivePlayerCount / data.maxPlayers) * 100 : 0;
  const freeSlots = Math.max(0, (data.maxPlayers || 0) - effectivePlayerCount);
  const avgPing = data.players.length > 0
    ? Math.round(data.players.reduce((sum, p) => sum + p.ping, 0) / data.players.length)
    : 0;
  const pingMin = data.players.length > 0 ? Math.min(...data.players.map((p) => p.ping)) : 0;
  const pingMax = data.players.length > 0 ? Math.max(...data.players.map((p) => p.ping)) : 0;
  const pingBuckets = data.players.reduce(
    (acc, p) => {
      if (p.ping <= 50) acc.excellent++;
      else if (p.ping <= 100) acc.good++;
      else if (p.ping <= 150) acc.moderate++;
      else acc.poor++;
      return acc;
    },
    { excellent: 0, good: 0, moderate: 0, poor: 0 },
  );
  const pingMaxBucket = Math.max(pingBuckets.excellent, pingBuckets.good, pingBuckets.moderate, pingBuckets.poor, 1);

  const capacityStatus = !data.maxPlayers
    ? { label: "Unknown", color: "hsl(var(--muted-foreground))" }
    : playerPercentage >= 95
      ? { label: "Full", color: "hsl(var(--red))" }
      : playerPercentage >= 75
        ? { label: "Busy", color: "hsl(var(--orange))" }
        : playerPercentage >= 35
          ? { label: "Healthy", color: "hsl(var(--green))" }
          : playerPercentage > 0
            ? { label: "Light", color: "hsl(var(--green))" }
            : { label: "Empty", color: "hsl(var(--muted-foreground))" };

  const pingTone =
    avgPing === 0
      ? "hsl(var(--muted-foreground))"
      : avgPing < 80
        ? "hsl(var(--green))"
        : avgPing < 150
          ? "hsl(var(--yellow))"
          : "hsl(var(--red))";
  const pingLabel =
    avgPing === 0 ? "No data" : avgPing < 80 ? "Excellent" : avgPing < 150 ? "Moderate" : "Poor";

  const copyToClipboard = (text: string, label: string) => {
    if (streamerMode) {
      toast.error("Copying disabled in Streamer Mode");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const stripColorCodes = (str: string) => {
    return str.replace(/\^[0-9]/g, '').replace(/~[a-zA-Z]~/g, '').replace(/\[.*?\]/g, '');
  };

  const parseTags = (tags: string) => {
    return tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  };
  const tagCount = data.tags ? parseTags(data.tags).length : 0;

  const getConnectionString = () => {
    if (data.ip && data.port) {
      return `connect ${data.ip}:${data.port}`;
    }
    return null;
  };

  const website = (data.vars?.sv_projectWebsite || data.vars?.website || data.vars?.Website || data.vars?.sv_website || '').toString().trim();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Cheater Warning Banner */}
      {stableCheaterMatches.length > 0 && (
        <div>
          <CheaterWarningBanner matches={stableCheaterMatches} />
        </div>
      )}

      {/* Professional Hero + Side Details Panel */}
      <div className="grid grid-cols-1 gap-4 items-start">
        {/* LEFT: Compact intelligence card */}
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          {/* Slim status accent strip */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/70 via-[hsl(var(--green))]/30 to-transparent" />

          {/* Top status / action bar */}
          <div className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-border/30 bg-background/20">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--green))] opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--green))]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live · Server Inspection</span>
              {lastUpdate && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 ml-2 pl-2 border-l border-border/40">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                  {isPolling && <span className="text-primary animate-pulse">· sync</span>}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {onRefresh && (
                <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isPolling}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                </Button>
              )}
              {notificationProps && (
                <NotificationSettingsDialog
                  serverCode={data.licenseKeyToken?.split('_')[0] || ''}
                  serverName={data.hostname}
                  hasNotification={notificationProps.hasNotification}
                  currentSettings={notificationProps.currentSettings}
                  permissionGranted={notificationProps.permissionGranted}
                  onRequestPermission={notificationProps.onRequestPermission}
                  onSave={notificationProps.onSave}
                  onRemove={notificationProps.onRemove}
                />
              )}
              {onToggleFavorite && (
                <Button variant="ghost" size="icon" onClick={onToggleFavorite}
                  className={`h-7 w-7 ${isFavorite ? "text-yellow hover:text-yellow" : "text-muted-foreground hover:text-yellow"}`}>
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-yellow' : ''}`} />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}
                className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Identity row */}
          <div className="px-5 pt-5 pb-4 flex items-start gap-4">
            <div className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border/50 bg-secondary/50 flex items-center justify-center ${iconLoading && !iconUrl ? 'animate-pulse' : ''}`}>
              {iconUrl && !iconError ? (
                <img src={iconUrl} alt="Server icon" className="w-full h-full object-cover" />
              ) : (
                <Server className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground break-words leading-tight tracking-tight">
                {stripColorCodes(data.hostname)}
              </h2>
              {data.projectName && (
                <p className="text-muted-foreground text-xs mt-1 truncate">{stripColorCodes(data.projectName)}</p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {serverCode && (
                  <button
                    onClick={() => copyToClipboard(`cfx.re/join/${serverCode}`, "CFX URL")}
                    className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/40 border border-border/40 hover:border-[hsl(var(--green))]/40 transition-colors"
                  >
                    <Link2 className="w-2.5 h-2.5 text-[hsl(var(--green))]/80" />
                    <span className="font-mono text-[10px] text-[hsl(var(--green))]/90">cfx.re/join/{serverCode}</span>
                    <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                  </button>
                )}
                {detectedAntiCheats.length > 0 && detectedAntiCheats.map((ac) => (
                  <Tooltip key={ac.name}>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(var(--green))]/10 text-[hsl(var(--green))] border border-[hsl(var(--green))]/25 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        {ac.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This server has <strong>{ac.name}</strong> protection enabled</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {data.gametype && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] text-foreground/80">
                        <Layers className="w-2.5 h-2.5 text-muted-foreground" />
                        {data.gametype}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Game type</TooltipContent>
                  </Tooltip>
                )}
                {data.mapname && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] text-foreground/80">
                        <MapPin className="w-2.5 h-2.5" /> {data.mapname}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Active map</TooltipContent>
                  </Tooltip>
                )}
                {data.enforceGameBuild && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] font-mono text-foreground/80">
                        b{data.enforceGameBuild}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Enforced game build</TooltipContent>
                  </Tooltip>
                )}
                {data.resources.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] text-foreground/80">
                        <Download className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="tabular-nums">{data.resources.length}</span>
                        <span className="text-muted-foreground">resources</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Loaded server resources</TooltipContent>
                  </Tooltip>
                )}
                {tagCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] text-foreground/80">
                        <Tag className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="tabular-nums">{tagCount}</span>
                        <span className="text-muted-foreground">tags</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Server tags</TooltipContent>
                  </Tooltip>
                )}
                {data.locale && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] font-mono text-foreground/80">
                        <Languages className="w-2.5 h-2.5 text-muted-foreground" />
                        {data.locale.toUpperCase()}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Server locale</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${data.private ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25' : 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))] border-[hsl(var(--green))]/25'}`}>
                      {data.private ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                      {data.private ? 'Private' : 'Public'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{data.private ? 'Connection requires whitelist / private key' : 'Open to public connections'}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {getConnectionString() && (
              <Button
                onClick={() => copyToClipboard(getConnectionString()!, "Connect Command")}
                className="hidden sm:inline-flex bg-[hsl(var(--green))] hover:bg-[hsl(var(--green))]/90 text-background font-semibold text-xs px-4 h-9 rounded-md shrink-0"
              >
                Forbindelse
              </Button>
            )}
          </div>

          {/* Inline metric tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-border/30 divide-x divide-y sm:divide-y-0 divide-border/30">
            {/* Players */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-4 py-3 hover:bg-background/30 transition-colors cursor-default">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Players</span>
                    <Users className="w-3 h-3 text-[hsl(var(--green))]" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-foreground tabular-nums leading-none">{effectivePlayerCount}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">/ {data.maxPlayers || "—"}</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full bg-secondary/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(playerPercentage, 100)}%`, background: capacityStatus.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] tabular-nums">
                    <span className="text-muted-foreground">{freeSlots} free</span>
                    {data.players.length === 0 && effectivePlayerCount > 0 ? (
                      <span className="text-[hsl(var(--yellow))] inline-flex items-center gap-0.5">
                        <EyeOff className="w-2.5 h-2.5" /> hidden
                      </span>
                    ) : (
                      <span className="text-muted-foreground">live</span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {effectivePlayerCount} players online · {freeSlots} free slots
              </TooltipContent>
            </Tooltip>

            {/* Capacity */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-4 py-3 hover:bg-background/30 transition-colors cursor-default">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Capacity</span>
                    <Gauge className="w-3 h-3" style={{ color: capacityStatus.color }} />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-foreground tabular-nums leading-none">
                      {playerPercentage.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  {/* Segmented capacity bar (10 segments) */}
                  <div className="mt-1.5 flex gap-[2px] h-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const filled = playerPercentage >= (i + 1) * 10;
                      const partial =
                        !filled && playerPercentage > i * 10 && playerPercentage < (i + 1) * 10;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-[1px]"
                          style={{
                            background: filled
                              ? capacityStatus.color
                              : partial
                                ? `color-mix(in oklab, ${capacityStatus.color} 50%, transparent)`
                                : "hsl(var(--muted-foreground) / 0.2)",
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span
                      className="font-semibold uppercase tracking-wider"
                      style={{ color: capacityStatus.color }}
                    >
                      {capacityStatus.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {data.maxPlayers > 0 ? `${data.maxPlayers - effectivePlayerCount} left` : "—"}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {playerPercentage.toFixed(1)}% filled · {capacityStatus.label.toLowerCase()} load
              </TooltipContent>
            </Tooltip>

            {/* Avg Ping w/ distribution sparkline */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-4 py-3 hover:bg-background/30 transition-colors cursor-default">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Avg Ping</span>
                    <Activity className="w-3 h-3" style={{ color: pingTone }} />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold tabular-nums leading-none" style={{ color: pingTone }}>
                      {avgPing || "—"}
                    </span>
                    {avgPing > 0 && <span className="text-xs text-muted-foreground">ms</span>}
                  </div>
                  {/* Sparkline: 4 ping buckets */}
                  <div className="mt-1.5 flex items-end gap-[2px] h-4" aria-hidden>
                    {[
                      { v: pingBuckets.excellent, c: "hsl(var(--green))" },
                      { v: pingBuckets.good, c: "hsl(var(--green))" },
                      { v: pingBuckets.moderate, c: "hsl(var(--yellow))" },
                      { v: pingBuckets.poor, c: "hsl(var(--red))" },
                    ].map((b, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-[1px] transition-all"
                        style={{
                          height: `${Math.max(b.v > 0 ? 18 : 6, (b.v / pingMaxBucket) * 100)}%`,
                          background:
                            b.v > 0 ? b.c : "hsl(var(--muted-foreground) / 0.2)",
                          opacity: b.v > 0 ? 1 : 0.5,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] tabular-nums">
                    <span className="text-muted-foreground">
                      {data.players.length > 0 ? `${pingMin}–${pingMax}ms` : "no samples"}
                    </span>
                    <span className="font-semibold uppercase tracking-wider" style={{ color: pingTone }}>
                      {pingLabel}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Distribution: ≤50ms {pingBuckets.excellent} · ≤100ms {pingBuckets.good} · ≤150ms {pingBuckets.moderate} · &gt;150ms {pingBuckets.poor}
              </TooltipContent>
            </Tooltip>

            {/* Access */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-4 py-3 hover:bg-background/30 transition-colors cursor-default">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Access</span>
                    {data.private ? (
                      <Lock className="w-3 h-3 text-[hsl(var(--red))]" />
                    ) : (
                      <Unlock className="w-3 h-3 text-[hsl(var(--green))]" />
                    )}
                  </div>
                  <div
                    className={`text-lg font-bold leading-none ${data.private ? 'text-[hsl(var(--red))]' : 'text-[hsl(var(--green))]'}`}
                  >
                    {data.private ? 'Private' : 'Public'}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-secondary/60 border border-border/30 text-foreground/75">
                      <Languages className="w-2.5 h-2.5" /> {data.locale?.toUpperCase() || 'EN'}
                    </span>
                    {detectedAntiCheats.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[hsl(var(--green))]/10 border border-[hsl(var(--green))]/25 text-[hsl(var(--green))]">
                        <ShieldCheck className="w-2.5 h-2.5" /> AC×{detectedAntiCheats.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="text-muted-foreground">
                      {data.onesyncEnabled ? 'OneSync on' : 'OneSync off'}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {data.enforceGameBuild ? `b${data.enforceGameBuild}` : '—'}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {data.private ? 'Whitelist required to join' : 'Open to public connections'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Endpoint + integrated server metadata */}
          {data.ip && (
            <div className="px-5 py-2.5 border-t border-border/30 bg-background/20 flex items-center gap-3 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Endpoint</span>
              <button
                onClick={() => copyToClipboard(`${data.ip}:${data.port}`, "IP Address")}
                className="inline-flex items-center gap-2 group"
              >
                <SensitiveText type="ip" as="span" className="font-mono text-xs text-foreground/90 group-hover:text-foreground">
                  {data.ip}:{data.port}
                </SensitiveText>
                <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
              </button>
            </div>
          )}

          {/* Server Metadata — compact KPI/badge row replacing the old sidebar */}
          {(() => {
            type Kpi = {
              label: string;
              value: React.ReactNode;
              icon: React.ComponentType<{ className?: string }>;
              tone?: string;
              hint?: string;
              href?: string;
              copy?: string;
              mono?: boolean;
            };
            const kpis: Kpi[] = [];
            kpis.push({
              label: "Resources",
              value: data.resources.length,
              icon: Download,
              hint: "loaded",
              mono: true,
            });
            if (data.tags) {
              kpis.push({
                label: "Tags",
                value: parseTags(data.tags).length,
                icon: Tag,
                hint: "categories",
                mono: true,
              });
            }
            if (data.locale)
              kpis.push({ label: "Locale", value: data.locale.toUpperCase(), icon: Languages, mono: true });
            if (data.gametype)
              kpis.push({ label: "Game Type", value: data.gametype, icon: Gamepad2 });
            if (data.mapname)
              kpis.push({ label: "Map", value: data.mapname, icon: MapPin });
            kpis.push({
              label: "OneSync",
              value: data.onesyncEnabled ? "Enabled" : "Off",
              icon: Layers,
              tone: data.onesyncEnabled ? "hsl(var(--green))" : "hsl(var(--muted-foreground))",
            });
            kpis.push({
              label: "Script Hook",
              value: data.scriptHookAllowed ? "Allowed" : "Blocked",
              icon: ShieldCheck,
              tone: data.scriptHookAllowed ? "hsl(var(--orange))" : "hsl(var(--green))",
            });
            if (data.pureLevel)
              kpis.push({ label: "Pure", value: `Lv ${data.pureLevel}`, icon: ShieldCheck, mono: true });
            kpis.push({
              label: "Build",
              value: data.enforceGameBuild ? `b${data.enforceGameBuild}` : "Default",
              icon: Hash,
              mono: true,
            });
            if (data.premiumTier)
              kpis.push({
                label: "Premium",
                value: <span className="capitalize">{data.premiumTier}</span>,
                icon: Star,
                tone: "hsl(var(--yellow))",
              });
            if (detectedAntiCheats.length > 0)
              kpis.push({
                label: "Anti-Cheat",
                value: detectedAntiCheats.map((a) => a.name).join(" · "),
                icon: ShieldCheck,
                tone: "hsl(var(--green))",
              });
            kpis.push({
              label: "Population",
              value: `${effectivePlayerCount}/${data.maxPlayers || "—"}`,
              icon: Users,
              hint: `${playerPercentage.toFixed(0)}%`,
              mono: true,
            });
            if (avgPing > 0)
              kpis.push({
                label: "Avg Ping",
                value: `${avgPing}ms`,
                icon: Signal,
                hint: `${pingMin}–${pingMax}`,
                tone: pingTone,
                mono: true,
              });
            kpis.push({
              label: "Access",
              value: data.private ? "Private" : "Public",
              icon: data.private ? Lock : Unlock,
              tone: data.private ? "hsl(var(--red))" : "hsl(var(--green))",
            });
            if (data.ownerName)
              kpis.push({
                label: "Developer",
                value: data.ownerName,
                icon: Building2,
                href: data.ownerProfile || undefined,
              });
            if (data.discordGuildId)
              kpis.push({
                label: "Discord",
                value: `discord.gg/${data.discordGuildId}`,
                icon: MessageCircle,
                href: `https://discord.gg/${data.discordGuildId}`,
                mono: true,
              });
            if (website)
              kpis.push({
                label: "Website",
                value: website.replace(/^https?:\/\//, ""),
                icon: Globe,
                href: website.startsWith("http") ? website : `https://${website}`,
                mono: true,
              });
            if (data.txAdmin)
              kpis.push({ label: "txAdmin", value: data.txAdmin, icon: Activity, mono: true });
            if (data.upvotePower && data.upvotePower > 0)
              kpis.push({
                label: "Upvotes",
                value: data.upvotePower.toLocaleString(),
                icon: Star,
                mono: true,
                tone: "hsl(var(--yellow))",
              });
            if (data.burstPower && data.burstPower > 0)
              kpis.push({
                label: "Burst",
                value: data.burstPower.toLocaleString(),
                icon: Activity,
                mono: true,
                tone: "hsl(var(--orange))",
              });

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 border-t border-border/30 divide-x divide-y divide-border/20">
                {kpis.map((k, i) => {
                  const Icon = k.icon;
                  const valueEl = (
                    <span
                      className={`text-[12px] font-semibold text-foreground truncate ${k.mono ? "font-mono" : ""}`}
                      style={k.tone ? { color: k.tone } : undefined}
                    >
                      {k.value}
                    </span>
                  );
                  return (
                    <div
                      key={i}
                      className="group px-3 py-2 hover:bg-background/30 transition-colors min-w-0"
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          <Icon className="w-2.5 h-2.5" />
                          {k.label}
                        </span>
                        {k.hint && (
                          <span className="text-[9px] font-mono text-muted-foreground/70 tabular-nums">
                            {k.hint}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        {k.href ? (
                          <a
                            href={k.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 min-w-0 hover:text-[hsl(var(--green))] transition-colors"
                          >
                            {valueEl}
                            <ExternalLink className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                          </a>
                        ) : (
                          valueEl
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Tags chip cluster — when present */}
          {data.tags && parseTags(data.tags).length > 0 && (
            <div className="px-5 py-2.5 border-t border-border/30 bg-background/10 flex items-center gap-2 flex-wrap">
              <Tag className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mr-1">
                Tags
              </span>
              {parseTags(data.tags).slice(0, 20).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-secondary/60 border border-border/30 text-[10px] text-foreground/75"
                >
                  {tag}
                </span>
              ))}
              {parseTags(data.tags).length > 20 && (
                <span className="text-[10px] text-muted-foreground">
                  +{parseTags(data.tags).length - 20} more
                </span>
              )}
            </div>
          )}
        </div>

      </div>



      {/* Project Description */}
      {data.projectDesc && (
        <div className="glass-card p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">About This Server</p>
              <p className="text-sm text-foreground">{data.projectDesc}</p>
            </div>
          </div>
        </div>
      )}


      {/* Server Snapshot — compact KPI tiles with status + context */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/70 via-[hsl(var(--green))]/30 to-transparent" />
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/30 bg-background/20">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[hsl(var(--green))]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Server Snapshot</h3>
            <span className="text-[9px] font-mono text-muted-foreground/70 border-l border-border/40 pl-3">
              Real-time configuration
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            SVR · {(serverCode || 'unknown').toUpperCase()}
          </span>
        </div>
        {(() => {
          type Tile = {
            label: string;
            value: React.ReactNode;
            context?: React.ReactNode;
            status?: { tone: string; label: string };
            icon: React.ComponentType<{ className?: string }>;
          };
          const tiles: Tile[] = [
            {
              label: 'Game Build',
              value: data.enforceGameBuild ? `b${data.enforceGameBuild}` : 'Default',
              context: data.enforceGameBuild ? 'Enforced' : 'No enforcement',
              status: data.enforceGameBuild
                ? { tone: 'hsl(var(--green))', label: 'Locked' }
                : { tone: 'hsl(var(--muted-foreground))', label: 'Open' },
              icon: Hash,
            },
            {
              label: 'OneSync',
              value: data.onesyncEnabled ? 'Enabled' : 'Disabled',
              context: data.onesyncEnabled ? 'Modern netcode' : 'Legacy netcode',
              status: data.onesyncEnabled
                ? { tone: 'hsl(var(--green))', label: 'Active' }
                : { tone: 'hsl(var(--muted-foreground))', label: 'Off' },
              icon: Layers,
            },
            {
              label: 'Script Hook',
              value: data.scriptHookAllowed ? 'Allowed' : 'Blocked',
              context: data.scriptHookAllowed ? 'Mods permitted' : 'Mods denied',
              status: data.scriptHookAllowed
                ? { tone: 'hsl(var(--orange))', label: 'Allowed' }
                : { tone: 'hsl(var(--green))', label: 'Protected' },
              icon: ShieldCheck,
            },
            {
              label: 'Pure Level',
              value: data.pureLevel || '0',
              context:
                data.pureLevel === '2'
                  ? 'Strict integrity'
                  : data.pureLevel === '1'
                    ? 'Verified files'
                    : 'No enforcement',
              status:
                data.pureLevel === '2'
                  ? { tone: 'hsl(var(--green))', label: 'Strict' }
                  : data.pureLevel === '1'
                    ? { tone: 'hsl(var(--yellow))', label: 'Soft' }
                    : { tone: 'hsl(var(--muted-foreground))', label: 'None' },
              icon: ShieldCheck,
            },
            {
              label: 'Premium',
              value: <span className="capitalize">{data.premiumTier || 'None'}</span>,
              context: data.premiumTier ? 'CFX boost active' : 'Free tier',
              status: data.premiumTier
                ? { tone: 'hsl(var(--yellow))', label: 'Boosted' }
                : { tone: 'hsl(var(--muted-foreground))', label: 'Free' },
              icon: Star,
            },
            {
              label: 'Anti-Cheat',
              value:
                detectedAntiCheats.length > 0
                  ? detectedAntiCheats.map((a) => a.name).join(' · ')
                  : 'None detected',
              context: `${detectedAntiCheats.length} detected in resources`,
              status:
                detectedAntiCheats.length > 0
                  ? { tone: 'hsl(var(--green))', label: 'Active' }
                  : { tone: 'hsl(var(--muted-foreground))', label: 'Unknown' },
              icon: ShieldCheck,
            },
          ];
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-border/20">
              {tiles.map((t, i) => (
                <div key={i} className="px-4 py-3 hover:bg-background/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t.label}
                    </span>
                    <t.icon className="w-3 h-3 text-muted-foreground/70" />
                  </div>
                  <div className="text-sm font-bold text-foreground truncate leading-tight">
                    {t.value}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px]">
                    <span className="text-muted-foreground/80 truncate">{t.context}</span>
                    {t.status && (
                      <span
                        className="inline-flex items-center gap-1 font-bold uppercase tracking-wider shrink-0 ml-1"
                        style={{ color: t.status.tone }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: t.status.tone }}
                        />
                        {t.status.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>


      {/* ============ ONLINE PLAYERS — FLAGSHIP ============ */}
      {(() => {
        const buckets = data.players.reduce(
          (acc, p) => {
            if (p.ping <= 50) acc.excellent++;
            else if (p.ping <= 100) acc.good++;
            else if (p.ping <= 150) acc.moderate++;
            else acc.poor++;
            return acc;
          },
          { excellent: 0, good: 0, moderate: 0, poor: 0 }
        );
        const total = data.players.length;
        const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

        return (
          <section className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
            {/* Status accent strip */}
            <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/70 via-[hsl(var(--green))]/30 to-transparent" />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-5 py-3 border-b border-border/30 bg-background/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[hsl(var(--green))]" />
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
                    Online Players
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground border-l border-border/40 pl-3">
                  {effectivePlayerCount} live · avg {avgPing || "—"}ms
                </span>
                {data.players.length === 0 && effectivePlayerCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))] cursor-help">
                        <EyeOff className="w-2.5 h-2.5" />
                        Names hidden
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>This server does not expose player names via the public API.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {data.players.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const names = data.players.map((p) => p.name).join("\n");
                      navigator.clipboard.writeText(names);
                      toast.success(`Copied ${data.players.length} player names`);
                    }}
                    className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-3 h-3 mr-1.5" />
                    Copy all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const headers = ["Index", "Name", "ID", "Ping", "Steam", "Discord", "FiveM", "License"];
                      const rows = data.players.map((p, idx) => {
                        const ids = p.identifiers || [];
                        const steam = ids.find((i) => i.startsWith("steam:"))?.replace("steam:", "") || "";
                        const discord = ids.find((i) => i.startsWith("discord:"))?.replace("discord:", "") || "";
                        const fivem = ids.find((i) => i.startsWith("fivem:"))?.replace("fivem:", "") || "";
                        const license = ids.find((i) => i.startsWith("license:"))?.replace("license:", "") || "";
                        const escapedName = p.name.replace(/"/g, '""');
                        return `${idx + 1},"${escapedName}",${p.id},${p.ping},"${steam}","${discord}","${fivem}","${license}"`;
                      });
                      const csv = [headers.join(","), ...rows].join("\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `players_${serverCode || "export"}_${new Date().toISOString().split("T")[0]}.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      toast.success(`Exported ${data.players.length} players`);
                      GamificationService.onExport();
                    }}
                    className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Download className="w-3 h-3 mr-1.5" />
                    Export CSV
                  </Button>
                </div>
              )}
            </div>

            {/* Connection-quality summary strip */}
            {total > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border/30 divide-x divide-border/30">
                {[
                  { label: "Excellent", range: "0–50ms", count: buckets.excellent, color: "hsl(var(--green))" },
                  { label: "Good", range: "50–100ms", count: buckets.good, color: "hsl(var(--green))" },
                  { label: "Moderate", range: "100–150ms", count: buckets.moderate, color: "hsl(var(--yellow))" },
                  { label: "Poor", range: "150ms+", count: buckets.poor, color: "hsl(var(--red))" },
                ].map((b) => (
                  <div key={b.label} className="px-4 py-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {b.label}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground/70">{b.range}</span>
                    </div>
                    <div className="text-base font-bold tabular-nums mt-0.5" style={{ color: b.color }}>
                      {b.count}
                    </div>
                    <div className="mt-1 h-1 w-full bg-secondary/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct(b.count)}%`, background: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar: search + sort */}
            <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 border-b border-border/30 bg-background/10">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search players by name..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background/40 border-border/40 focus-visible:ring-[hsl(var(--green))]/40"
                />
                {playerSearch && (
                  <button
                    onClick={() => setPlayerSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="inline-flex items-center rounded-md border border-border/40 bg-background/40 p-0.5">
                {(["name", "id", "ping"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlayerSort(s)}
                    className={`px-3 h-8 text-[11px] font-medium uppercase tracking-wider rounded-[5px] transition-colors ${
                      playerSort === s
                        ? "bg-[hsl(var(--green))]/15 text-[hsl(var(--green))]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontally scrollable player table */}
            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                {/* Column header */}
                <div
                  className="grid gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/30 border-b border-border/30"
                  style={{ gridTemplateColumns: PLAYER_ROW_GRID }}
                >
                  <span>#</span>
                  <span>Player</span>
                  <span>Steam</span>
                  <span>Discord</span>
                  <span>Rockstar</span>
                  <span>Ping</span>
                  <span className="text-right">Actions</span>
                </div>

                {/* Rows */}
                <div className="max-h-[640px] overflow-y-auto divide-y divide-border/20">
                  {sortedPlayers.length > 0 ? (
                    (() => {
                      const total = data.players.length;
                      const idsAsc = [...data.players].sort((a, b) => a.id - b.id).map((p) => p.id);
                      const rankById = new Map<number, number>();
                      idsAsc.forEach((id, i) => rankById.set(id, i + 1));
                      return sortedPlayers.map((player, index) => (
                        <PlayerRowCompact
                          key={`${player.id}-${player.name}`}
                          player={player}
                          index={index}
                          searchQuery={playerSearch}
                          cheaterReport={isCheater(player)}
                          serverCode={serverCode || undefined}
                          serverName={serverNameClean}
                          onCheaterAdded={fetchCheaters}
                          joinOrder={{ rank: rankById.get(player.id) || 0, total }}
                        />
                      ));
                    })()
                  ) : (
                    <div className="py-12 text-center">
                      <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {effectivePlayerCount > 0
                          ? playerSearch
                            ? `No players match "${playerSearch}"`
                            : "Player list not available for this server"
                          : "No players online"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })()}




      {/* Resource Categories — primary visual grouping */}
      <ResourceCategories resources={data.resources} />

      {/* All resources (raw, searchable) — collapsible */}
      <section className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/40 via-[hsl(var(--green))]/15 to-transparent" />
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-border/30 bg-background/20">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[hsl(var(--green))]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
              All Resources
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground border-l border-border/40 pl-3 tabular-nums">
              {data.resources.length} loaded
            </span>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Filter…"
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              className="pl-7 h-7 text-[11px] bg-background/40 border-border/40"
            />
          </div>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
            {displayedResources.map((resource) => (
              <button
                key={resource}
                onClick={() => copyToClipboard(resource, 'Resource')}
                className="px-2 py-1 rounded bg-background/40 border border-border/30 hover:border-[hsl(var(--green))]/40 hover:bg-background/60 text-[10.5px] font-mono text-foreground/80 hover:text-foreground transition-colors text-left truncate"
              >
                {resource}
              </button>
            ))}
          </div>
          {filteredResources.length > 18 && (
            <button
              onClick={() => setShowAllResources(!showAllResources)}
              className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-[hsl(var(--green))] mx-auto transition-colors"
            >
              {showAllResources ? (
                <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Show all {filteredResources.length} <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>
      </section>


      {/* Server Owner Card */}
      <ServerOwnerCard
        ownerName={data.ownerName}
        ownerProfile={data.ownerProfile}
        ownerAvatar={data.ownerAvatar}
      />

      {/* ============ LOCATION ============ */}
      {data.location && (
        <section className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/40 via-[hsl(var(--green))]/15 to-transparent" />
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-background/20">
            <Globe className="w-4 h-4 text-[hsl(var(--green))]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
              Infrastructure
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/20">
            {[
              { label: "Country", value: data.location.country, icon: MapPin },
              { label: "Region", value: data.location.region, icon: MapPin },
              { label: "City", value: data.location.city, icon: MapPin },
              { label: "ISP", value: data.location.isp, icon: Wifi },
            ].map((c) => (
              <div key={c.label} className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <c.icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {c.label}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{c.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resource Inspector */}
      {data.resources && data.resources.length > 0 && (
        <ResourceInspector resources={data.resources} />
      )}



    </div>
  );
};

export default ServerDetails;
