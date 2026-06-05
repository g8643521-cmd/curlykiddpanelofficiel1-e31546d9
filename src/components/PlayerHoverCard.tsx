import { ReactNode } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Clock,
  Calendar,
  Activity,
  Briefcase,
  User as UserIcon,
  Shield,
  AlertTriangle,
  Ban,
  Hash,
  Gamepad2,
  Wifi,
} from "lucide-react";
import SensitiveText from "./SensitiveText";
import { getPlayerPlaceholder } from "@/lib/playerPlaceholder";

interface Props {
  player: { id: number; name: string; ping: number; identifiers?: string[] };
  children: ReactNode;
}

const Row = ({
  label,
  value,
  icon: Icon,
  mono,
  sensitive,
  tone,
}: {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
  sensitive?: boolean;
  tone?: "default" | "warning" | "danger" | "success";
}) => {
  const toneClass =
    tone === "warning"
      ? "text-[hsl(var(--yellow))]"
      : tone === "danger"
        ? "text-[hsl(var(--red))]"
        : tone === "success"
          ? "text-[hsl(var(--green))]"
          : "text-foreground";
  const inner = (
    <span className={`text-[11px] font-medium text-right truncate ${mono ? "font-mono" : ""} ${toneClass}`}>
      {value}
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-background/40 transition-colors">
      <div className="flex items-center gap-1.5 min-w-0">
        {Icon && <Icon className="w-3 h-3 text-muted-foreground shrink-0" />}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</span>
      </div>
      {sensitive ? (
        <SensitiveText type="identifier" as="span" className={`text-[11px] font-medium text-right truncate ${mono ? "font-mono" : ""} ${toneClass}`}>
          {value as string}
        </SensitiveText>
      ) : (
        inner
      )}
    </div>
  );
};

const PlayerHoverCard = ({ player, children }: Props) => {
  const p = getPlayerPlaceholder(player);
  const pingTone = player.ping <= 80 ? "success" : player.ping <= 150 ? "warning" : "danger";

  return (
    <HoverCard openDelay={250} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-80 p-0 border-border/50 bg-card/95 backdrop-blur-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/40 bg-background/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--green))] ring-2 ring-card" />
            <h4 className="text-sm font-semibold text-foreground truncate">{player.name}</h4>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">#{player.id}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-muted-foreground">{p.country.flag} {p.country.name}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 border-l border-border/40 pl-2">
              {p.rank}
            </span>
          </div>
        </div>

        {/* Identities */}
        <div className="px-1 py-1 border-b border-border/30">
          <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Identities
          </div>
          <Row label="Discord" value={p.discordUsername} icon={Hash} mono />
          <Row label="Discord ID" value={p.discordId} icon={Hash} mono sensitive />
          <Row label="Rockstar" value={p.rockstarName} icon={Gamepad2} mono />
          <Row label="Steam" value={p.steamName} icon={UserIcon} />
        </div>

        {/* Activity */}
        <div className="px-1 py-1 border-b border-border/30">
          <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Activity
          </div>
          <Row label="First seen" value={p.firstSeen} icon={Calendar} />
          <Row label="Last seen" value={p.lastSeen} icon={Clock} tone="success" />
          <Row label="Total playtime" value={p.totalPlaytime} icon={Activity} mono />
          <Row label="Last 30 days" value={p.playtime30d} icon={Activity} mono />
          <Row label="Session" value={p.sessionTime} icon={Clock} mono />
          <Row label="Ping" value={`${player.ping} ms`} icon={Wifi} mono tone={pingTone} />
        </div>

        {/* In-game */}
        <div className="px-1 py-1 border-b border-border/30">
          <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">
            In-game
          </div>
          <Row label="Character" value={p.characterName} icon={UserIcon} />
          <Row label="Job" value={p.job} icon={Briefcase} />
          <Row label="Rank" value={p.rank} icon={Shield} />
        </div>

        {/* Moderation */}
        <div className="px-1 py-1">
          <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">
            Moderation
          </div>
          <div className="grid grid-cols-3 gap-px bg-border/30 mx-2 mb-2 rounded-md overflow-hidden">
            <div className="bg-card/80 px-2 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="w-2.5 h-2.5" /> Warns
              </div>
              <div className={`text-sm font-bold tabular-nums mt-0.5 ${p.warnings > 0 ? "text-[hsl(var(--yellow))]" : "text-foreground"}`}>
                {p.warnings}
              </div>
            </div>
            <div className="bg-card/80 px-2 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                <Ban className="w-2.5 h-2.5" /> Kicks
              </div>
              <div className={`text-sm font-bold tabular-nums mt-0.5 ${p.kicks > 0 ? "text-[hsl(var(--orange))]" : "text-foreground"}`}>
                {p.kicks}
              </div>
            </div>
            <div className="bg-card/80 px-2 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                <Ban className="w-2.5 h-2.5" /> Bans
              </div>
              <div className={`text-sm font-bold tabular-nums mt-0.5 ${p.bans > 0 ? "text-[hsl(var(--red))]" : "text-foreground"}`}>
                {p.bans}
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default PlayerHoverCard;
