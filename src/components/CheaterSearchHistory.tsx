import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Trash2, ArrowUpRight, Copy, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useCheaterSearchHistory, type CheaterSearchHistoryItem } from "@/hooks/useCheaterSearchHistory";
import { useState } from "react";

const Item = memo(({
  item,
  onRemove,
}: {
  item: CheaterSearchHistoryItem;
  onRemove: (id: string) => void | Promise<unknown>;
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const isDiscordId = /^\d{17,19}$/.test(item.query);
  const hasHits = (item.results_count ?? 0) > 0;

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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpen(); }}
      className="group relative flex items-center gap-4 px-4 py-4 rounded-xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 hover:border-border/60 transition-colors cursor-pointer"
    >
      <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center border ${hasHits ? "bg-destructive/15 border-destructive/40 text-destructive" : "bg-muted/30 border-border/40 text-muted-foreground"}`}>
        {hasHits ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-base font-semibold text-foreground truncate leading-tight">
            {item.query}
          </p>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {isDiscordId ? "Discord ID" : "Name"}
          </Badge>
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
        <p className="mt-1 text-xs text-muted-foreground">
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
            <div key={i} className="h-16 bg-secondary/40 rounded-xl animate-pulse" />
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
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
          {history.map((item) => (
            <Item key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CheaterSearchHistory;
