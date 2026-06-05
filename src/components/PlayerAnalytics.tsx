import { Users, UserPlus, RefreshCw, Trophy, Clock } from "lucide-react";
import { getPlayerPlaceholder } from "@/lib/playerPlaceholder";

interface Player {
  id: number;
  name: string;
  ping: number;
  identifiers?: string[];
}

interface Props {
  players: Player[];
}

const PlayerAnalytics = ({ players }: Props) => {
  const enriched = players.map((p) => ({ p, x: getPlayerPlaceholder(p) }));

  const mostActive = [...enriched]
    .sort((a, b) => b.x.sessionMinutes - a.x.sessionMinutes)
    .slice(0, 3);

  const newPlayers = enriched.filter((e) => {
    const d = new Date(e.x.firstSeen).getTime();
    return Date.now() - d < 7 * 86_400_000;
  }).length;

  const returningPlayers = Math.max(0, players.length - newPlayers);

  const highestPlaytime = [...enriched].sort(
    (a, b) => parseInt(b.x.totalPlaytime) - parseInt(a.x.totalPlaytime),
  )[0];

  const avgSession =
    players.length > 0
      ? Math.round(
          enriched.reduce((sum, e) => sum + e.x.sessionMinutes, 0) / players.length,
        )
      : 0;
  const avgSessionLabel =
    avgSession < 60 ? `${avgSession}m` : `${Math.floor(avgSession / 60)}h ${avgSession % 60}m`;

  const cards: Array<{
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }> = [
    {
      label: "Most Active",
      value: mostActive[0]?.p.name || "—",
      sub: mostActive[0] ? `${mostActive[0].x.sessionTime} session` : "No data",
      icon: Trophy,
      accent: "hsl(var(--yellow))",
    },
    {
      label: "New (7d)",
      value: newPlayers,
      sub: "First seen this week",
      icon: UserPlus,
      accent: "hsl(var(--green))",
    },
    {
      label: "Returning",
      value: returningPlayers,
      sub: "Known players online",
      icon: RefreshCw,
      accent: "hsl(var(--green))",
    },
    {
      label: "Top Playtime",
      value: highestPlaytime?.x.totalPlaytime || "—",
      sub: highestPlaytime?.p.name || "No data",
      icon: Users,
      accent: "hsl(var(--green))",
    },
    {
      label: "Avg Session",
      value: avgSessionLabel,
      sub: `Across ${players.length} player${players.length === 1 ? "" : "s"}`,
      icon: Clock,
      accent: "hsl(var(--green))",
    },
  ];

  return (
    <section className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/40 via-[hsl(var(--green))]/15 to-transparent" />
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/30 bg-background/20">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[hsl(var(--green))]" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
            Player Analytics
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground border-l border-border/40 pl-3">
            placeholder data
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y md:divide-y-0 divide-border/20">
        {cards.map((c) => (
          <div key={c.label} className="px-4 py-3.5 hover:bg-background/30 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {c.label}
              </span>
              <span style={{ color: c.accent }}>
                <c.icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div
              className="text-lg font-bold tabular-nums text-foreground truncate"
              title={typeof c.value === "string" ? c.value : undefined}
            >
              {c.value}
            </div>
            {c.sub && (
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.sub}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlayerAnalytics;
