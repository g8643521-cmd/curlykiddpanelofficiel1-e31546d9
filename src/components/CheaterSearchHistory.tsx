import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Trash2,
  ArrowUpRight,
  Copy,
  Check,
  Shield,
  Ticket,
  Users,
  Flag,
  Hash,
  User,
  ServerCog,
  Database,
  UserSearch,
  Ban,
  MessageSquare,
  Activity,
  Clock,
  Star,
  CalendarClock,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useCheaterSearchHistory, type CheaterSearchHistoryItem } from "@/hooks/useCheaterSearchHistory";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCustomIcons } from "@/hooks/useCustomIcons";
import CustomIconDialog from "@/components/CustomIconDialog";

const typeLabel = (t?: string) => {
  switch (t) {
    case "discord": return { label: "Discord ID", icon: Hash };
    case "steam":   return { label: "Steam",      icon: Hash };
    case "fivem":   return { label: "FiveM",      icon: Hash };
    case "license": return { label: "License",    icon: Hash };
    default:        return { label: "Name",       icon: User };
  }
};

const sourceLabel = (s?: string) => {
  if (s === "cheaters_db") return { label: "Cheaters DB", icon: Database };
  return { label: "Player Locator", icon: UserSearch };
};

const Item = memo(({
  item,
  onRemove,
}: {
  item: CheaterSearchHistoryItem;
  onRemove: (id: string) => void | Promise<unknown>;
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [iconDialogOpen, setIconDialogOpen] = useState(false);
  const { get: getCustomIcon, set: setCustomIcon, remove: removeCustomIcon } = useCustomIcons("cheater");
  const customIcon = getCustomIcon(item.query);
  const meta = item.metadata || {};
  const hasHits = (item.results_count ?? 0) > 0;
  const typeInfo = typeLabel(meta.query_type);
  const srcInfo = sourceLabel(meta.source);
  const TypeIcon = typeInfo.icon;
  const SrcIcon = srcInfo.icon;

  const handleOpen = useCallback(() => {
    navigate(`/cheaters?q=${encodeURIComponent(item.query)}`);
  }, [navigate, item.query]);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(item.query);
        setCopied(true);
        toast({ title: "Copied", description: item.query });
        setTimeout(() => setCopied(false), 1500);
      } catch {/* noop */}
    },
    [item.query]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void onRemove(item.id);
    },
    [item.id, onRemove]
  );

  const globalName = meta.sx_global_name;
  const username = meta.sx_username;
  const displayName = globalName || username;
  const avatarUrl = meta.sx_avatar_url;
  const tickets = meta.sx_tickets ?? 0;
  const guilds = meta.sx_guilds ?? 0;
  const bans = meta.sx_bans ?? 0;
  const messages = meta.sx_messages ?? 0;
  const anticheat = meta.sx_anticheat ?? 0;
  const confirmed = meta.db_confirmed ?? 0;
  const suspected = meta.db_suspected ?? 0;
  const flagged = !!meta.sx_flagged;
  const guildNames = (meta.sx_guild_names || []).slice(0, 3);
  const topGuild = meta.sx_top_guild;
  const lastAction = meta.sx_last_action;
  const firstSeen = meta.sx_first_seen ? new Date(meta.sx_first_seen) : null;
  const lastSeen = meta.sx_last_seen ? new Date(meta.sx_last_seen) : null;

  return (
    <>
    <ContextMenu>
      <ContextMenuTrigger asChild>
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpen(); }}
      className="group relative flex items-start gap-4 px-4 py-4 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 hover:border-border/60 transition-colors cursor-pointer"
    >
      {customIcon ? (
        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-border/40 bg-secondary">
          <img src={customIcon} alt={displayName || item.query} className="w-full h-full object-cover" />
        </div>
      ) : avatarUrl ? (
        <Avatar className="w-12 h-12 shrink-0 border border-border/40">
          <AvatarImage src={avatarUrl} alt={displayName || item.query} />
          <AvatarFallback className="bg-secondary text-xs font-semibold">
            {(displayName || item.query).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center border ${hasHits || flagged ? "bg-destructive/15 border-destructive/40 text-destructive" : "bg-muted/30 border-border/40 text-muted-foreground"}`}>
          {hasHits || flagged ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-2">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          {displayName ? (
            <p className="text-base font-semibold text-foreground truncate leading-tight">
              {displayName}
            </p>
          ) : (
            <p className="text-base font-semibold text-foreground truncate leading-tight font-mono">
              {item.query}
            </p>
          )}
          {globalName && username && username !== globalName && (
            <span className="text-[11px] text-muted-foreground">@{username}</span>
          )}
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide flex items-center gap-1">
            <TypeIcon className="w-3 h-3" /> {typeInfo.label}
          </Badge>
          {flagged && (
            <Badge variant="destructive" className="text-[10px]">
              <Flag className="w-3 h-3 mr-1" /> Flagged
            </Badge>
          )}
          {hasHits ? (
            <Badge variant="destructive" className="text-[10px]">
              {item.results_count} {item.results_count === 1 ? "match" : "matches"}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/40">
              Clean
            </Badge>
          )}
        </div>

        {/* Query / Discord ID */}
        {displayName && (
          <p className="text-[11px] text-muted-foreground font-mono truncate">
            {meta.sx_discord_id ? <><Hash className="w-3 h-3 inline -mt-0.5" /> {meta.sx_discord_id}</> : item.query}
          </p>
        )}

        {/* Stat chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {confirmed > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 border border-destructive/30 text-[11px] text-destructive">
              <AlertTriangle className="w-3 h-3" /> {confirmed} confirmed
            </span>
          )}
          {suspected > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(var(--yellow))]/10 border border-[hsl(var(--yellow))]/30 text-[11px] text-[hsl(var(--yellow))]">
              <Shield className="w-3 h-3" /> {suspected} suspected
            </span>
          )}
          {bans > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 border border-destructive/30 text-[11px] text-destructive">
              <Ban className="w-3 h-3" /> {bans} bans
            </span>
          )}
          {tickets > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[11px] text-muted-foreground">
              <Ticket className="w-3 h-3" /> {tickets} tickets
            </span>
          )}
          {guilds > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[11px] text-muted-foreground">
              <Users className="w-3 h-3" /> {guilds} guilds
            </span>
          )}
          {anticheat > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[11px] text-muted-foreground">
              <Activity className="w-3 h-3" /> {anticheat} AC events
            </span>
          )}
          {messages > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[11px] text-muted-foreground">
              <MessageSquare className="w-3 h-3" /> {messages} msgs
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-[11px] text-muted-foreground">
            <SrcIcon className="w-3 h-3" /> {srcInfo.label}
          </span>
        </div>

        {/* Top guild */}
        {topGuild && (
          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
            <Star className="w-3 h-3 text-[hsl(var(--yellow))]" />
            Most active in <span className="text-foreground font-medium">{topGuild.name}</span>
            <span className="text-muted-foreground">({topGuild.count} actions)</span>
          </p>
        )}

        {/* Guild names preview */}
        {guildNames.length > 0 && (
          <p className="text-[11px] text-muted-foreground truncate">
            <ServerCog className="w-3 h-3 inline mr-1 -mt-0.5" />
            {guildNames.join(" • ")}
            {(meta.sx_guild_names?.length || 0) > guildNames.length && ` +${(meta.sx_guild_names!.length - guildNames.length)} more`}
          </p>
        )}

        {/* Last action */}
        {lastAction && (
          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last: <span className="text-foreground">{lastAction.action}</span>
            {lastAction.guild && <span>in {lastAction.guild}</span>}
            {lastAction.time && <span>· {formatDistanceToNow(new Date(lastAction.time), { addSuffix: true })}</span>}
          </p>
        )}

        {/* First / last seen */}
        {(firstSeen || lastSeen) && (
          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
            <CalendarClock className="w-3 h-3" />
            {firstSeen && <>First seen {formatDistanceToNow(firstSeen, { addSuffix: true })}</>}
            {firstSeen && lastSeen && firstSeen.getTime() !== lastSeen.getTime() && <span>· </span>}
            {lastSeen && firstSeen?.getTime() !== lastSeen.getTime() && (
              <>Last seen {formatDistanceToNow(lastSeen, { addSuffix: true })}</>
            )}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground">
          Searched {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>


      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleCopy}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          title="Copy query"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleOpen(); }}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          title="Open details"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
Item.displayName = "CheaterSearchHistoryItem";

const CheaterSearchHistory = () => {
  const { history, isLoading, removeItem, clearAll } = useCheaterSearchHistory();

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">Cheater Searches</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-secondary/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 hover:border-border/50 transition-all duration-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">Cheater Searches</h3>
          {history.length > 0 && (
            <span className="text-sm text-muted-foreground">({history.length})</span>
          )}
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void clearAll()}
            className="text-destructive hover:text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-muted-foreground">No cheater searches yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Every player lookup you run will be logged here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[640px] overflow-y-auto pr-2">
          {history.map((item) => (
            <Item key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CheaterSearchHistory;
