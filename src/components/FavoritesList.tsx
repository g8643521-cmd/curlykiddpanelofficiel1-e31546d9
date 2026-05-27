import { memo, useCallback, useState } from "react";
import {
  Star,
  Server,
  Trash2,
  ArrowRight,
  Users,
  Plus,
  Search,
  Lightbulb,
} from "lucide-react";
import { FavoritesGlyph } from "@/components/icons/PanelIcons";
import { Button } from "@/components/ui/button";
import { Favorite } from "@/hooks/useFavorites";
import { stripColorCodes } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";

interface ServerStatus {
  serverCode: string;
  serverName: string;
  playerCount: number;
  maxPlayers: number;
  isOnline: boolean;
  lastChecked: Date;
}

interface FavoritesListProps {
  favorites: Favorite[];
  isLoading: boolean;
  onSelect: (serverCode: string) => void;
  onRemove: (serverCode: string) => void;
  serverStatuses?: Map<string, ServerStatus>;
}

const FavoriteItem = memo(({
  favorite,
  status,
  onSelect,
  onRemove,
}: {
  favorite: Favorite;
  status?: ServerStatus;
  onSelect: (code: string) => void;
  onRemove: (code: string) => void;
}) => {
  const [showRemove, setShowRemove] = useState(false);

  const handleClick = useCallback(() => {
    onSelect(favorite.server_code);
  }, [favorite.server_code, onSelect]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(favorite.server_code);
    },
    [favorite.server_code, onRemove]
  );

  const displayName = stripColorCodes(
    favorite.server_name || favorite.server_code
  );
  const isOnline = status?.isOnline;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
      className="group relative flex items-center gap-3 px-3 py-3 rounded-lg border border-transparent bg-transparent hover:bg-secondary/40 hover:border-border/40 transition-colors cursor-pointer"
    >
      {/* Avatar + status dot */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-md overflow-hidden bg-secondary/60 border border-border/30 flex items-center justify-center">
          <Server className="w-4 h-4 text-muted-foreground" />
        </div>
        {status && (
          <span
            aria-hidden
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card ${
              isOnline ? "bg-emerald-500" : "bg-muted-foreground/60"
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">
          {displayName}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 min-w-0 flex-wrap">
          <code className="font-mono text-[12px] text-foreground/70 truncate">
            cfx.re/join/
            <span className="text-foreground/90">{favorite.server_code}</span>
          </code>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground/70 truncate">
          {status ? (
            <>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {status.playerCount.toLocaleString()}/{status.maxPlayers.toLocaleString()}
              </span>
              <span>•</span>
              <span className={isOnline ? "text-emerald-500/80" : "text-muted-foreground/60"}>
                {isOnline ? "Online" : "Offline"}
              </span>
              <span>•</span>
              <span>
                Last scanned {formatDistanceToNow(status.lastChecked, { addSuffix: true })}
              </span>
            </>
          ) : (
            <span>CFX Code: {favorite.server_code}</span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={handleRemove}
          className={`p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all ${
            showRemove ? "opacity-100" : "opacity-0"
          }`}
          title="Remove from favorites"
          aria-label="Remove from favorites"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
});

FavoriteItem.displayName = "FavoriteItem";

const FavoritesList = memo(
  ({ favorites, isLoading, onSelect, onRemove, serverStatuses }: FavoritesListProps) => {
    const { t } = useI18n();
    const navigate = useNavigate();

    const handleRemove = useCallback(
      (serverCode: string) => {
        onRemove(serverCode);
      },
      [onRemove]
    );

    if (isLoading) {
      return (
        <div className="rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 hover:border-border/50 transition-all duration-300 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="text-[hsl(var(--yellow))]">
              <FavoritesGlyph size={20} />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              {t("favorites.title")}
            </h3>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      );
    }

    if (favorites.length === 0) {
      return (
        <div className="rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 hover:border-border/50 transition-all duration-300 p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="text-[hsl(var(--yellow))]">
              <FavoritesGlyph size={20} />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              {t("favorites.title")}
            </h3>
          </div>

          {/* Empty state */}
          <div className="rounded-lg border border-border/30 bg-secondary/20 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-yellow/10 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {t("favorites.empty_title")}
              </h4>
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[260px]">
                {t("favorites.empty_desc2")}
              </p>

              <div className="mt-5 flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <Button
                  size="sm"
                  className="w-full sm:w-auto h-9 text-[13px] gap-2"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  <Search className="w-3.5 h-3.5" />
                  {t("favorites.browse_servers")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto h-9 text-[13px] gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("favorites.add_manually")}
                </Button>
              </div>
            </div>

            {/* Tip */}
            <div className="mt-5 pt-4 border-t border-border/20 flex items-start gap-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                {t("favorites.tip")}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 hover:border-border/50 transition-all duration-300 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="text-[hsl(var(--yellow))]">
            <FavoritesGlyph size={20} />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">
            {t("favorites.title")}
          </h3>
          <span className="ml-auto text-xs font-medium text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-full">
            {favorites.length}
          </span>
        </div>
        <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
          {favorites.map((favorite) => (
            <FavoriteItem
              key={favorite.id}
              favorite={favorite}
              status={serverStatuses?.get(favorite.server_code)}
              onSelect={onSelect}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>
    );
  }
);

FavoritesList.displayName = "FavoritesList";

export default FavoritesList;
