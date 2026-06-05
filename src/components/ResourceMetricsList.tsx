import { useMemo, useState } from "react";
import { Search, Activity, Cpu, RefreshCw, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  resources: string[];
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

interface ResourceMetric {
  name: string;
  cpu: number; // %
  memory: number; // MB
  restarts: number;
  status: "running" | "warning" | "error";
  version: string;
  author: string;
  description: string;
  dependencies: string[];
}

const STATUS_TONE: Record<ResourceMetric["status"], { color: string; bg: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  running: { color: "hsl(var(--green))", bg: "hsl(var(--green))/15", label: "Running", Icon: CheckCircle2 },
  warning: { color: "hsl(var(--yellow))", bg: "hsl(var(--yellow))/15", label: "Warning", Icon: AlertTriangle },
  error: { color: "hsl(var(--red))", bg: "hsl(var(--red))/15", label: "Error", Icon: AlertTriangle },
};

const COMMON_AUTHORS = ["overextended", "esx-framework", "qbcore", "citizenfx", "community", "internal"];

const generateMetric = (name: string, allResources: string[]): ResourceMetric => {
  const h = hash(name);
  const statusRoll = h % 100;
  const status: ResourceMetric["status"] =
    statusRoll < 88 ? "running" : statusRoll < 97 ? "warning" : "error";
  const cpu =
    status === "running" ? (h % 8) + (h % 4) * 0.5 : status === "warning" ? 18 + (h % 12) : 35 + (h % 25);
  const memory = 8 + (h % 220);
  const restarts = status === "running" ? h % 2 : (h % 5) + 1;

  // pick a few "dependencies" from the same server
  const deps: string[] = [];
  const depCount = h % 4;
  for (let i = 0; i < depCount && allResources.length > 1; i++) {
    const candidate = allResources[(h + i * 7) % allResources.length];
    if (candidate !== name && !deps.includes(candidate)) deps.push(candidate);
  }

  return {
    name,
    cpu: Math.round(cpu * 10) / 10,
    memory,
    restarts,
    status,
    version: `1.${(h % 9) + 1}.${h % 20}`,
    author: COMMON_AUTHORS[h % COMMON_AUTHORS.length],
    description: `${name} is a server-side resource providing functionality used by the framework. Replace this placeholder with metadata from fxmanifest.lua when available.`,
    dependencies: deps,
  };
};

const ResourceMetricsList = ({ resources }: Props) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<ResourceMetric | null>(null);

  const metrics = useMemo(
    () => resources.map((r) => generateMetric(r, resources)),
    [resources],
  );

  const filtered = metrics.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  const displayed = showAll ? filtered : filtered.slice(0, 24);

  if (resources.length === 0) return null;

  return (
    <section className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/40 via-[hsl(var(--green))]/15 to-transparent" />
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/30 bg-background/20">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[hsl(var(--green))]" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
            Resource Metrics
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground border-l border-border/40 pl-3">
            {filtered.length} of {resources.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-background/40 border-border/40"
          />
        </div>

        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-y border-border/30 bg-background/30">
          <span className="col-span-5">Resource</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2 text-right">CPU</span>
          <span className="col-span-2 text-right">Memory</span>
          <span className="col-span-1 text-right">Restarts</span>
        </div>

        <div className="divide-y divide-border/20">
          {displayed.map((m) => {
            const tone = STATUS_TONE[m.status];
            return (
              <button
                key={m.name}
                onClick={() => setSelected(m)}
                className="w-full grid grid-cols-12 gap-3 items-center px-3 py-2.5 text-left hover:bg-background/40 transition-colors"
              >
                <span className="col-span-12 md:col-span-5 font-mono text-[11px] text-foreground truncate">
                  {m.name}
                </span>
                <span className="col-span-4 md:col-span-2 inline-flex items-center gap-1.5">
                  <tone.Icon className="w-3 h-3" style={{ color: tone.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tone.color }}>
                    {tone.label}
                  </span>
                </span>
                <span className="col-span-3 md:col-span-2 text-right font-mono text-[11px] tabular-nums text-foreground/80">
                  {m.cpu}%
                </span>
                <span className="col-span-3 md:col-span-2 text-right font-mono text-[11px] tabular-nums text-foreground/80">
                  {m.memory} MB
                </span>
                <span className="col-span-2 md:col-span-1 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {m.restarts}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length > 24 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 mx-auto flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-[hsl(var(--green))] transition-colors"
          >
            {showAll ? "Show less" : `Show all ${filtered.length}`}
          </button>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-base">{selected.name}</DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Version</div>
                    <div className="font-mono text-sm text-foreground mt-0.5">{selected.version}</div>
                  </div>
                  <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Author</div>
                    <div className="text-sm text-foreground mt-0.5 truncate">{selected.author}</div>
                  </div>
                  <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Cpu className="w-2.5 h-2.5" /> CPU
                    </div>
                    <div className="font-mono text-sm text-foreground mt-0.5">{selected.cpu}%</div>
                  </div>
                  <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Activity className="w-2.5 h-2.5" /> Memory
                    </div>
                    <div className="font-mono text-sm text-foreground mt-0.5">{selected.memory} MB</div>
                  </div>
                  <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      <RefreshCw className="w-2.5 h-2.5" /> Restarts
                    </div>
                    <div className="font-mono text-sm text-foreground mt-0.5">{selected.restarts}</div>
                  </div>
                  <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Status</div>
                    <div
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: STATUS_TONE[selected.status].color }}
                    >
                      {STATUS_TONE[selected.status].label}
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2">
                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    <Download className="w-2.5 h-2.5" /> Dependencies
                  </div>
                  {selected.dependencies.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">No dependencies</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.dependencies.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded bg-secondary border border-border/40 text-[10px] font-mono text-foreground/80"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ResourceMetricsList;
