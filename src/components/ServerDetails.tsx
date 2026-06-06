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
import ResourceCategories from "@/components/ResourceCategories";
import ServerOwnerCard from "@/components/ServerOwnerCard";
import ResourceInspector from "@/components/ResourceInspector";
import PlayerAnalytics from "@/components/PlayerAnalytics";
import ServerHealth from "@/components/ServerHealth";
import ResourceMetricsList from "@/components/ResourceMetricsList";


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
  const avgPing = data.players.length > 0
    ? Math.round(data.players.reduce((sum, p) => sum + p.ping, 0) / data.players.length)
    : 0;

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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] text-foreground/80">
                    {data.gametype}
                  </span>
                )}
                {data.mapname && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] text-foreground/80">
                    <MapPin className="w-2.5 h-2.5" /> {data.mapname}
                  </span>
                )}
                {data.enforceGameBuild && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[10px] font-mono text-foreground/80">
                    b{data.enforceGameBuild}
                  </span>
                )}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-border/30 divide-x divide-border/30">
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Players</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-foreground tabular-nums">{effectivePlayerCount}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">/ {data.maxPlayers}</span>
              </div>
              <div className="mt-1.5 h-1 w-full bg-secondary/60 rounded-full overflow-hidden">
                <div className="h-full bg-[hsl(var(--green))] rounded-full transition-all" style={{ width: `${Math.min(playerPercentage, 100)}%` }} />
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Capacity</div>
              <div className="text-lg font-bold text-foreground tabular-nums">
                {playerPercentage.toFixed(1)}<span className="text-xs text-muted-foreground">%</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Filled</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Ping</div>
              <div className={`text-lg font-bold tabular-nums ${avgPing === 0 ? 'text-muted-foreground' : avgPing < 80 ? 'text-[hsl(var(--green))]' : avgPing < 150 ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--red))]'}`}>
                {avgPing || '—'}{avgPing > 0 && <span className="text-xs text-muted-foreground ml-0.5">ms</span>}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Network</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Access</div>
              <div className={`text-lg font-bold ${data.private ? 'text-[hsl(var(--red))]' : 'text-[hsl(var(--green))]'}`}>
                {data.private ? 'Private' : 'Public'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{data.locale?.toUpperCase() || 'EN'}</div>
            </div>
          </div>

          {/* Secondary endpoint row */}
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
        </div>

        {/* RIGHT: Details side panel — matches FiveM browser style */}
        <aside className="rounded-2xl border border-border/40 bg-card p-5 space-y-5 lg:sticky lg:top-4 h-fit shadow-xl">
          {/* DETAILS */}
          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Details</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              {/* cfx chip + project chip row */}
              <div className="flex flex-wrap gap-1.5">
                {serverCode && (
                  <button
                    onClick={() => copyToClipboard(`cfx.re/join/${serverCode}`, "CFX URL")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary border border-border/40 hover:bg-secondary/70 transition-colors"
                  >
                    <span className="font-mono text-xs text-foreground/90">cfx.re/join/{serverCode}</span>
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
                {data.projectName && (
                  <button
                    onClick={() => copyToClipboard(stripColorCodes(data.projectName!), "Project name")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary border border-border/40 hover:bg-secondary/70 transition-colors"
                  >
                    <span className="text-xs text-foreground/90 truncate max-w-[140px]">{stripColorCodes(data.projectName)}</span>
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {data.ownerName && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-muted-foreground text-xs">Developer:</span>
                  {data.ownerProfile ? (
                    <a
                      href={data.ownerProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground text-xs font-medium hover:underline truncate"
                    >
                      {data.ownerName}
                    </a>
                  ) : (
                    <span className="text-foreground text-xs font-medium truncate">{data.ownerName}</span>
                  )}
                </div>
              )}
              {data.discordGuildId && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Discord:</span>
                  <a
                    href={`https://discord.gg/${data.discordGuildId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--red))] text-xs font-medium hover:underline underline truncate"
                  >
                    discord.gg/{data.discordGuildId}
                  </a>
                </div>
              )}
              {website && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Hjemmeside:</span>
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--red))] text-xs font-medium hover:underline underline truncate"
                  >
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-muted-foreground text-xs">Access</span>
                <span className={`text-xs font-semibold ${data.private ? 'text-[hsl(var(--red))]' : 'text-[hsl(var(--green))]'}`}>
                  {data.private ? 'Private' : 'Public'}
                </span>
              </div>
            </div>
          </section>

          {/* RESOURCER */}
          {data.resources.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Resourcer</h3>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums font-semibold">{data.resources.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(showAllSideResources ? data.resources : data.resources.slice(0, 5)).map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded bg-secondary border border-border/40 text-[10px] font-mono text-foreground/80 truncate max-w-[120px]">
                    {r}
                  </span>
                ))}
                {data.resources.length > 5 && (
                  <button
                    onClick={() => setShowAllSideResources((v) => !v)}
                    className="px-2 py-0.5 rounded bg-secondary border border-border/40 text-[10px] font-medium text-foreground/90 hover:bg-secondary/70 transition-colors"
                  >
                    {showAllSideResources ? 'Show less' : 'Show all'}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* TAGS */}
          {data.tags && parseTags(data.tags).length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Tags</h3>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums font-semibold">{parseTags(data.tags).length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parseTags(data.tags).map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-secondary border border-border/40 text-[10px] text-foreground/80">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* REPORT SERVER */}
          <button
            onClick={() => toast.info("Report submitted for review")}
            className="w-full inline-flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground hover:text-[hsl(var(--red))] transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Report Server
          </button>
        </aside>
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


      {/* Server Info Grid — refined data manifest */}
      <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-background/20">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[hsl(var(--green))]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Server Manifest</h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">SVR · {(serverCode || 'unknown').toUpperCase()}</span>
        </div>
        {(() => {
          const rows: Array<{ label: string; value: React.ReactNode; mono?: boolean }> = [
            { label: 'Game Type', value: data.gametype || 'FiveM' },
            { label: 'Map', value: data.mapname || 'Unknown' },
            { label: 'Game Build', value: data.enforceGameBuild || 'Default', mono: true },
            { label: 'OneSync', value: <span className={data.onesyncEnabled ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}>{data.onesyncEnabled ? 'Enabled' : 'Disabled'}</span> },
            { label: 'Premium', value: <span className="capitalize">{data.premiumTier || 'None'}</span> },
            { label: 'Locale', value: (data.locale || 'en').toUpperCase(), mono: true },
            { label: 'Server Version', value: data.server ? data.server.split(' ')[0] : 'Unknown', mono: true },
            { label: 'Script Hook', value: <span className={data.scriptHookAllowed ? 'text-[hsl(var(--orange))]' : 'text-[hsl(var(--green))]'}>{data.scriptHookAllowed ? 'Allowed' : 'Blocked'}</span> },
            { label: 'Pure Level', value: data.pureLevel || '0', mono: true },
            { label: 'Access', value: <span className={data.private ? 'text-[hsl(var(--red))]' : 'text-[hsl(var(--green))]'}>{data.private ? 'Private' : 'Public'}</span> },
            { label: 'Enhanced Host', value: <span className={data.enhancedHostSupport ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}>{data.enhancedHostSupport ? 'Yes' : 'No'}</span> },
            { label: 'Support', value: <span className="capitalize">{data.supportStatus || 'Unknown'}</span> },
          ];
          if (data.txAdmin) rows.push({ label: 'txAdmin', value: data.txAdmin, mono: true });
          if (data.upvotePower !== undefined && data.upvotePower > 0) rows.push({ label: 'Upvote Power', value: <span className="text-[hsl(var(--yellow))] font-mono">{data.upvotePower.toLocaleString()}</span> });
          if (data.burstPower !== undefined && data.burstPower > 0) rows.push({ label: 'Burst Power', value: <span className="text-[hsl(var(--orange))] font-mono">{data.burstPower.toLocaleString()}</span> });
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 divide-border/20 sm:[&>*:nth-child(n)]:border-b sm:[&>*:nth-child(n)]:border-border/20 sm:[&>*]:border-r sm:[&>*:nth-child(3n)]:border-r-0 sm:[&>*]:border-border/20">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-background/30 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{row.label}</span>
                  <span className={`text-xs font-medium text-foreground text-right truncate ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {data.discordGuildId && (
          <div className="px-5 py-3 border-t border-border/30 bg-background/20">
            <a
              href={`https://discord.gg/${data.discordGuildId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-[hsl(var(--green))] hover:underline font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Join Discord Server <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
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
                    sortedPlayers.map((player, index) => (
                      <PlayerRowCompact
                        key={`${player.id}-${player.name}`}
                        player={player}
                        index={index}
                        searchQuery={playerSearch}
                        cheaterReport={isCheater(player)}
                        serverCode={serverCode || undefined}
                        serverName={serverNameClean}
                        onCheaterAdded={fetchCheaters}
                      />
                    ))
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

      {/* ============ PLAYER ANALYTICS ============ */}
      <PlayerAnalytics players={data.players} />

      {/* ============ SERVER HEALTH ============ */}
      <ServerHealth
        avgPing={avgPing}
        currentPlayers={effectivePlayerCount}
        maxPlayers={data.maxPlayers}
        resourceCount={data.resources.length}
      />


      {/* ============ SERVER RESOURCES ============ */}
      <section className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/40 via-[hsl(var(--green))]/15 to-transparent" />
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/30 bg-background/20">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[hsl(var(--green))]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
              Server Resources
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground border-l border-border/40 pl-3">
              {data.resources.length} loaded
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background/40 border-border/40"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {displayedResources.map((resource) => (
              <button
                key={resource}
                onClick={() => copyToClipboard(resource, "Resource")}
                className="px-2.5 py-1.5 rounded-md bg-background/40 border border-border/30 hover:border-[hsl(var(--green))]/40 hover:bg-background/60 text-[11px] font-mono text-foreground/80 hover:text-foreground transition-colors text-left truncate"
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

      {/* ============ RESOURCE METRICS ============ */}
      <ResourceMetricsList resources={data.resources} />

      {/* Resource Categories */}
      <ResourceCategories resources={data.resources} />

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
