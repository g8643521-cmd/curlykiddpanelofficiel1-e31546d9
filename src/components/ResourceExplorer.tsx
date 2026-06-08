import { useState, useMemo } from "react";
import {
  Package,
  Car,
  Map as MapIcon,
  Users,
  Shield,
  Gamepad2,
  Code,
  MessageCircle,
  Settings,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  resources: string[];
}

type Risk = "safe" | "warning" | "danger" | "unknown";

interface ResourceInfo {
  name: string;
  category: string;
  description: string;
  risk: Risk;
}

const KNOWN: Record<string, Omit<ResourceInfo, "name">> = {
  es_extended: { category: "Framework", description: "ESX Framework", risk: "safe" },
  "qb-core": { category: "Framework", description: "QBCore Framework", risk: "safe" },
  ox_lib: { category: "Library", description: "Overextended library", risk: "safe" },
  ox_inventory: { category: "Inventory", description: "Overextended inventory", risk: "safe" },
  ox_target: { category: "Interaction", description: "Overextended targeting", risk: "safe" },
  oxmysql: { category: "Database", description: "Overextended MySQL driver", risk: "safe" },
  "mysql-async": { category: "Database", description: "MySQL async driver", risk: "safe" },
  txAdmin: { category: "Admin", description: "txAdmin server management", risk: "safe" },
  monitor: { category: "Admin", description: "txAdmin monitor", risk: "safe" },
  "pma-voice": { category: "Voice", description: "pma-voice VOIP", risk: "safe" },
  vMenu: { category: "Menu", description: "vMenu trainer/menu", risk: "warning" },
  "lambda-menu": { category: "Menu", description: "Lambda Menu trainer", risk: "danger" },
  mellotrainer: { category: "Menu", description: "Mello Trainer", risk: "danger" },
  badger_anticheat: { category: "Anti-Cheat", description: "Badger Anti-Cheat", risk: "safe" },
  "qs-anticheat": { category: "Anti-Cheat", description: "Quasar Anti-Cheat", risk: "safe" },
  wraithac: { category: "Anti-Cheat", description: "Wraith Anti-Cheat", risk: "safe" },
  fiveguard: { category: "Anti-Cheat", description: "FiveGuard", risk: "safe" },
};

const PATTERNS: { pattern: RegExp; label: string; risk: "warning" | "danger" }[] = [
  { pattern: /executor|inject|bypass|exploit/i, label: "Potential exploit tool", risk: "danger" },
  { pattern: /godmode|noclip|teleport/i, label: "Cheat-capable", risk: "danger" },
  { pattern: /trainer|cheat|hack/i, label: "Trainer/cheat resource", risk: "danger" },
  { pattern: /skid|leaked|crack/i, label: "Potentially leaked", risk: "danger" },
  { pattern: /webhook/i, label: "Webhook functionality", risk: "warning" },
  { pattern: /debug|dev_/i, label: "Debug resource", risk: "warning" },
];

const CATEGORIES = [
  { name: "All", icon: Package, keywords: [] as string[] },
  { name: "Framework", icon: Code, keywords: ["es_extended", "esx", "qb", "qbcore", "vrp", "framework", "core"] },
  { name: "Vehicles", icon: Car, keywords: ["car", "vehicle", "veh", "garage", "tuning", "mech"] },
  { name: "Maps", icon: MapIcon, keywords: ["map", "mlo", "interior", "ymap", "building"] },
  { name: "Jobs", icon: Users, keywords: ["job", "work", "economy", "bank", "shop", "business"] },
  { name: "Security", icon: Shield, keywords: ["admin", "anticheat", "ban", "kick", "txadmin", "ace"] },
  { name: "Gameplay", icon: Gamepad2, keywords: ["inventory", "hud", "ui", "menu", "notify", "target"] },
  { name: "Voice", icon: MessageCircle, keywords: ["voice", "radio", "chat", "mumble", "pma", "tokovoip"] },
  { name: "Utility", icon: Settings, keywords: ["util", "lib", "ox_lib", "mysql", "async"] },
];

const analyze = (name: string): ResourceInfo => {
  const lower = name.toLowerCase();
  const known = KNOWN[lower] || KNOWN[name];
  if (known) return { name, ...known };
  for (const { pattern, label, risk } of PATTERNS) {
    if (pattern.test(name)) return { name, category: "Flagged", description: label, risk };
  }
  if (lower.includes("anticheat")) return { name, category: "Anti-Cheat", description: "Anti-cheat", risk: "safe" };
  return { name, category: "Unknown", description: "Unrecognized resource", risk: "unknown" };
};

const inCategory = (name: string, cat: string): boolean => {
  if (cat === "All") return true;
  const def = CATEGORIES.find((c) => c.name === cat);
  if (!def) return false;
  const lower = name.toLowerCase();
  return def.keywords.some((kw) => lower.includes(kw));
};

const riskMeta = (risk: Risk) => {
  switch (risk) {
    case "safe":
      return { color: "hsl(var(--green))", label: "Safe", Icon: CheckCircle };
    case "warning":
      return { color: "hsl(var(--yellow))", label: "Warning", Icon: AlertTriangle };
    case "danger":
      return { color: "hsl(var(--red))", label: "Danger", Icon: XCircle };
    default:
      return { color: "hsl(var(--muted-foreground))", label: "Unknown", Icon: Package };
  }
};

const ResourceExplorer = ({ resources }: Props) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [riskFilter, setRiskFilter] = useState<Risk | "all">("all");

  const analyzed = useMemo(() => resources.map(analyze), [resources]);

  const stats = useMemo(
    () => ({
      total: analyzed.length,
      safe: analyzed.filter((r) => r.risk === "safe").length,
      warning: analyzed.filter((r) => r.risk === "warning").length,
      danger: analyzed.filter((r) => r.risk === "danger").length,
      unknown: analyzed.filter((r) => r.risk === "unknown").length,
    }),
    [analyzed],
  );

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of CATEGORIES) {
      map[c.name] = c.name === "All" ? resources.length : resources.filter((r) => inCategory(r, c.name)).length;
    }
    return map;
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return analyzed.filter((r) => {
      if (riskFilter !== "all" && r.risk !== riskFilter) return false;
      if (!inCategory(r.name, category)) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [analyzed, category, query, riskFilter]);

  const copyResource = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success("Resource copied");
  };

  if (resources.length === 0) return null;

  return (
    <section className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="h-[2px] w-full bg-gradient-to-r from-[hsl(var(--green))]/70 via-[hsl(var(--green))]/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/30 bg-background/20">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[hsl(var(--green))]" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Resource Explorer</h3>
          <span className="text-[10px] font-mono text-muted-foreground border-l border-border/40 pl-3 tabular-nums">
            {stats.total} loaded
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
          <span className="text-[hsl(var(--green))]">✓ {stats.safe}</span>
          {stats.warning > 0 && <span className="text-[hsl(var(--yellow))]">⚠ {stats.warning}</span>}
          {stats.danger > 0 && <span className="text-[hsl(var(--red))]">✗ {stats.danger}</span>}
          <span className="text-muted-foreground">? {stats.unknown}</span>
        </div>
      </div>

      {/* Controls: search + risk filter */}
      <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 border-b border-border/30 bg-background/10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background/40 border-border/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="inline-flex items-center rounded-md border border-border/40 bg-background/40 p-0.5">
          {(["all", "safe", "warning", "danger", "unknown"] as const).map((r) => {
            const active = riskFilter === r;
            const c =
              r === "safe"
                ? "hsl(var(--green))"
                : r === "warning"
                  ? "hsl(var(--yellow))"
                  : r === "danger"
                    ? "hsl(var(--red))"
                    : "hsl(var(--muted-foreground))";
            return (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-2.5 h-8 text-[10px] font-bold uppercase tracking-wider rounded-[5px] transition-colors ${
                  active ? "bg-background/80" : "text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { color: r === "all" ? "hsl(var(--foreground))" : c } : undefined}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-border/30 bg-background/5">
        {CATEGORIES.map((c) => {
          const count = categoryCounts[c.name] || 0;
          if (c.name !== "All" && count === 0) return null;
          const active = category === c.name;
          const Icon = c.icon;
          return (
            <button
              key={c.name}
              onClick={() => setCategory(c.name)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-colors ${
                active
                  ? "bg-[hsl(var(--green))]/15 text-[hsl(var(--green))] border border-[hsl(var(--green))]/30"
                  : "bg-background/40 text-muted-foreground hover:text-foreground border border-border/30"
              }`}
            >
              <Icon className="w-3 h-3" />
              {c.name}
              <span className="font-mono tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Resource list */}
      <div className="max-h-[480px] overflow-y-auto divide-y divide-border/20">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-xs text-muted-foreground">No resources match the filter.</div>
        ) : (
          filtered.map((res) => {
            const meta = riskMeta(res.risk);
            const Icon = meta.Icon;
            return (
              <div
                key={res.name}
                className="group flex items-center gap-3 px-4 py-2 hover:bg-background/30 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: meta.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-mono text-foreground truncate">{res.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{res.description}</div>
                </div>
                <span
                  className="hidden sm:inline-flex text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0"
                  style={{
                    color: meta.color,
                    background: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
                    borderColor: `color-mix(in oklab, ${meta.color} 25%, transparent)`,
                  }}
                >
                  {res.category}
                </span>
                <button
                  onClick={() => copyResource(res.name)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ResourceExplorer;
