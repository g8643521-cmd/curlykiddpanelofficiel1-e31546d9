import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Download, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { ModsGlyph } from '@/components/icons/PanelIcons';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { ModThumbnail } from '@/components/mods/ModThumbnail';

interface FiveMod {
  id: string;
  name: string;
  description: string | null;
  file_size: number | null;
  download_count: number;
  screenshots: string[] | null;
  version: string | null;
  created_at: string;
  updated_at: string | null;
  uploaded_by: string | null;
  mod_categories?: { name: string; icon: string } | null;
}

const LatestMods = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [mods, setMods] = useState<FiveMod[]>([]);
  const [uploaders, setUploaders] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestMods = async () => {
      const { data, error } = await supabase
        .from('fivem_mods')
        .select('id, name, description, file_size, download_count, version, created_at, updated_at, uploaded_by, screenshots, mod_categories(name, icon)')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching latest mods:', error);
        setIsLoading(false);
        return;
      }

      const list = (data || []) as unknown as FiveMod[];
      setMods(list);
      setIsLoading(false);

      const ids = Array.from(new Set(list.map((m) => m.uploaded_by).filter(Boolean))) as string[];
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', ids);
        const map: Record<string, string> = {};
        (profs || []).forEach((p: { id: string; display_name: string | null }) => {
          if (p.display_name) map[p.id] = p.display_name;
        });
        setUploaders(map);
      }
    };

    fetchLatestMods();
  }, []);

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0) return null;
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatShortDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCount = (n: number) => {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return n.toLocaleString();
  };

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-black/10 hover:border-border/50 transition-all duration-300 p-6">
      {children}
    </div>
  );

  const Header: React.FC<{ count?: number }> = ({ count }) => (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="text-[hsl(var(--purple))]">
          <ModsGlyph size={20} />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground">
          {t('mods.latest')}
        </h3>
        {typeof count === 'number' && (
          <span className="text-sm text-muted-foreground">({count})</span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/mods')}
        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
      >
        {t('mods.view_all')}
        <ArrowRight className="w-3 h-3" />
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <Wrapper>
        <Header />
        <div className="divide-y divide-border/20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <Skeleton className="w-12 h-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Wrapper>
    );
  }

  if (mods.length === 0) {
    return (
      <Wrapper>
        <Header />
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full border border-dashed border-border/50 flex items-center justify-center mx-auto mb-3">
            <Package className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground">{t('mods.empty')}</p>
          <Button variant="link" size="sm" onClick={() => navigate('/mods')} className="mt-1">
            {t('mods.browse')}
          </Button>
        </div>
      </Wrapper>
    );
  }

  const now = Date.now();

  return (
    <Wrapper>
      <Header count={mods.length} />
      <div className="divide-y divide-border/20 max-h-[440px] overflow-y-auto pr-1 -mr-1">
        {mods.map((mod) => {
          const category = mod.mod_categories?.name || 'Uncategorized';
          const size = formatFileSize(mod.file_size);
          const uploader = mod.uploaded_by ? uploaders[mod.uploaded_by] : null;
          const updatedAt = mod.updated_at ? new Date(mod.updated_at).getTime() : 0;
          const createdAt = new Date(mod.created_at).getTime();
          const wasUpdated = updatedAt && updatedAt - createdAt > 1000 * 60 * 60;
          const recentlyUpdated = wasUpdated && now - updatedAt < 1000 * 60 * 60 * 24 * 7;

          return (
            <button
              key={mod.id}
              onClick={() => navigate('/mods')}
              className="w-full flex items-center gap-3.5 py-3.5 px-1 text-left group transition-colors hover:bg-secondary/20 rounded-md"
            >
              <ModThumbnail
                src={mod.screenshots?.[0]}
                name={mod.name}
                className="w-12 h-12 rounded-md object-cover shrink-0 border border-border/30"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">
                    {mod.name}
                  </p>
                  {recentlyUpdated && (
                    <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Updated
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] min-w-0">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[hsl(var(--purple))]/10 text-[hsl(var(--purple))] font-medium border border-[hsl(var(--purple))]/15 leading-none">
                    {category}
                  </span>
                  {mod.version && (
                    <span className="font-mono text-muted-foreground/80">v{mod.version}</span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground/70 truncate">
                  {uploader ? `by ${uploader} · ` : ''}
                  {formatShortDate(mod.updated_at || mod.created_at)}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-[11px] text-foreground/80 tabular-nums">
                  <Download className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{formatCount(mod.download_count || 0)}</span>
                </div>
                {size && (
                  <span className="text-[10px] text-muted-foreground/60 font-mono">{size}</span>
                )}
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </Wrapper>
  );
};

export default LatestMods;
