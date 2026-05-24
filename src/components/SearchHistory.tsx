import { memo, useState, useCallback } from "react";
import { History, Server, Trash2, ArrowRight, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchHistoryItem } from "@/hooks/useSearchHistory";
import { formatDistanceToNow } from "date-fns";
import { stripColorCodes } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useServerIcon } from "@/hooks/useServerIcon";
import { toast } from "@/hooks/use-toast";

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
  const [copied, setCopied] = useState(false);
  const [showRemove, setShowRemove] = useState(false);

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
      className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg border border-transparent bg-transparent hover:bg-secondary/40 hover:border-border/40 transition-colors cursor-pointer ${
        isSelecting ? "opacity-70 pointer-events-none" : ""
      }`}
    >
      {/* Avatar + subtle status dot */}
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-md overflow-hidden bg-secondary/60 border border-border/30 flex items-center justify-center">
          {isSelecting ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : iconUrl ? (
            <img src={iconUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Server className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-tight">
          {displayName}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
          <code className="font-mono text-[12px] text-foreground/80 truncate">
            cfx.re/join/<span className="text-foreground">{item.query}</span>
          </code>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy CFX URL"
            aria-label="Copy CFX URL"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/70 truncate">
          Searched {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Hover actions */}
      <div className="shrink-0 flex items-center gap-1">
        {onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className={`p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all ${
              showRemove ? "opacity-100" : "opacity-0"
            }`}
            title="Remove from history"
            aria-label="Remove from history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mr-1">
          Search again
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
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
            <History className="w-5 h-5" />
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
            <History className="w-5 h-5" />
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
            <History className="w-5 h-5" />
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
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
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
