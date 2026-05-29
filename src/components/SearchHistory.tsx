import { memo, useState, useCallback } from "react";
import { History, Server, Trash2, ArrowRight, Loader2, Copy, Check, ArrowUpRight, ImageIcon } from "lucide-react";
import { HistoryGlyph } from "@/components/icons/PanelIcons";
import { Button } from "@/components/ui/button";
import { SearchHistoryItem } from "@/hooks/useSearchHistory";
import { formatDistanceToNow } from "date-fns";
import { stripColorCodes } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useServerIcon } from "@/hooks/useServerIcon";
import { toast } from "@/hooks/use-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCustomIcons } from "@/hooks/useCustomIcons";
import CustomIconDialog from "@/components/CustomIconDialog";

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  isLoading: boolean;
  onSelect: (serverCode: string) => Promise<void> | void;
  onClear: () => void;
  onRemove?: (id: string) => void | Promise<void> | Promise<boolean>;
}

const HistoryItem = memo(({
  item,
  onSelect,
  isSelecting,
  onSelectStart,
  onRemove,
}: {
  item: SearchHistoryItem;
  onSelect: (code: string) => Promise<void> | void;
  isSelecting: boolean;
  onSelectStart: (id: string) => void;
  onRemove?: (id: string) => void | Promise<void> | Promise<boolean>;
}) => {
  const { iconUrl } = useServerIcon(item.query);
  const { get: getCustomIcon, set: setCustomIcon, remove: removeCustomIcon } = useCustomIcons("server");
  const customIcon = getCustomIcon(item.query);
  const effectiveIcon = customIcon || iconUrl;
  const [copied, setCopied] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  const [iconDialogOpen, setIconDialogOpen] = useState(false);

  const displayName = stripColorCodes(
    item.search_type && item.search_type !== "server" ? item.search_type : item.query
  );

  const handleClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSelecting) return;
      onSelectStart(item.id);
      void onSelect(item.query);
    },
    [item.query, item.id, onSelect, onSelectStart, isSelecting]
  );

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(`cfx.re/join/${item.query}`);
        setCopied(true);
        toast({ title: "Copied", description: `cfx.re/join/${item.query}` });
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* noop */
      }
    },
    [item.query]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onRemove) void onRemove(item.id);
    },
    [item.id, onRemove]
  );

  const playerCount = item.player_count ?? 0;
  const maxPlayers = item.max_players ?? 0;
  const fillPct = maxPlayers > 0 ? Math.min(100, Math.round((playerCount / maxPlayers) * 100)) : 0;
  const isOnline = maxPlayers > 0;
  const hostname = item.search_type && item.search_type !== "server" ? item.search_type : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick(e);
      }}
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
      className={`group relative flex items-center gap-4 px-4 py-4 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 hover:border-border/60 transition-colors cursor-pointer ${
        isSelecting ? "opacity-70 pointer-events-none" : ""
      }`}
    >
      {/* Avatar + status dot */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary/60 border border-border/40 flex items-center justify-center">
          {isSelecting ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : iconUrl ? (
            <img src={iconUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Server className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <span
          aria-hidden
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-card ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-base font-semibold text-foreground truncate leading-tight">
            {displayName}
          </p>
          {isOnline && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              Online
            </span>
          )}
        </div>

        {hostname && displayName !== hostname && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{hostname}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <code className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-foreground/90 bg-secondary/40 px-2 py-1 rounded border border-border/30">
            cfx.re/join/<span className="text-foreground font-medium">{item.query}</span>
          </code>
        </div>

        {/* Meta chips: gametype, map, region */}
        {(item.gametype || item.mapname || item.region) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.gametype && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/80 bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
                {item.gametype}
              </span>
            )}
            {item.mapname && (
              <span className="text-[10px] font-medium text-foreground/80 bg-secondary/60 border border-border/40 px-2 py-0.5 rounded">
                🗺 {item.mapname}
              </span>
            )}
            {item.region && (
              <span className="text-[10px] font-medium text-foreground/80 bg-secondary/60 border border-border/40 px-2 py-0.5 rounded uppercase">
                {item.region}
              </span>
            )}
          </div>
        )}

        {isOnline && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-[hsl(var(--cyan))] transition-all"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-foreground/90 whitespace-nowrap tabular-nums">
              {playerCount} / {maxPlayers}
            </span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
              {fillPct}%
            </span>
          </div>
        )}

        <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-emerald-500" />
          Last searched {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Actions (always visible, more prominent on hover) */}
      <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleCopy}
          title="Copy CFX URL"
          aria-label="Copy CFX URL"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Remove from history"
            aria-label="Remove from history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <a
          href={`/embed/${item.query}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Open server page"
          aria-label="Open server page"
        >
          <ArrowUpRight className="w-4 h-4" />
        </a>
        <ArrowRight className="hidden sm:inline-block w-4 h-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all ml-1" />
      </div>
    </div>
  );
});

HistoryItem.displayName = "HistoryItem";

const SearchHistory = memo(({ history, isLoading, onSelect, onClear, onRemove }: SearchHistoryProps) => {
  const { t } = useI18n();
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const handleSelect = useCallback(async (serverCode: string) => {
    try {
      await onSelect(serverCode);
    } finally {
      setSelectingId(null);
    }
  }, [onSelect]);

  const handleSelectStart = useCallback((id: string) => {
    setSelectingId(id);
  }, []);

  const handleRemove = useCallback(
    async (id: string) => {
      if (onRemove) await onRemove(id);
    },
    [onRemove]
  );

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 hover:border-border/50 transition-all duration-300 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[hsl(var(--cyan))]">
            <HistoryGlyph size={20} />
          </div>
           <h3 className="font-display text-xl font-semibold text-foreground">{t('history.title')}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 hover:border-border/50 transition-all duration-300 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[hsl(var(--cyan))]">
            <HistoryGlyph size={20} />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">{t('history.title')}</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-cyan/10 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-cyan" />
          </div>
          <p className="text-muted-foreground">{t('history.empty')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('history.empty_desc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 hover:border-border/50 transition-all duration-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-[hsl(var(--cyan))]">
            <HistoryGlyph size={20} />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            {t('history.title')}
          </h3>
          <span className="text-sm text-muted-foreground">({history.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-destructive hover:text-destructive hover:bg-destructive/20"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t('history.clear')}
        </Button>
      </div>
      <div className="space-y-3 max-h-[640px] overflow-y-auto pr-2">
        {history.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            onSelect={handleSelect}
            isSelecting={selectingId === item.id}
            onSelectStart={handleSelectStart}
            onRemove={onRemove ? handleRemove : undefined}
          />
        ))}
      </div>
    </div>
  );
});

SearchHistory.displayName = "SearchHistory";

export default SearchHistory;
