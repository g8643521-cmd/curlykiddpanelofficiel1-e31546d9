import { ReactNode } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Hash, Gamepad2, User as UserIcon, Wifi, Shield, Fingerprint } from "lucide-react";
import SensitiveText from "./SensitiveText";

interface Props {
  player: { id: number; name: string; ping: number; identifiers?: string[] };
  children: ReactNode;
}

const parse = (ids: string[] = []) => {
  const out: Record<string, string> = {};
  for (const id of ids) {
    const idx = id.indexOf(":");
    if (idx < 0) continue;
    const k = id.slice(0, idx);
    const v = id.slice(idx + 1);
    if (!(k in out)) out[k] = v;
  }
  let steam64: string | undefined;
  if (out.steam && /^[0-9a-fA-F]+$/.test(out.steam)) {
    try {
      steam64 = BigInt("0x" + out.steam).toString();
    } catch {
      /* ignore */
    }
  }
  return { ...out, steam64 };
};

const Row = ({
  label,
  value,
  icon: Icon,
  sensitive,
  mono = true,
}: {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  sensitive?: boolean;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-background/40 transition-colors">
    <div className="flex items-center gap-1.5 min-w-0">
      {Icon && <Icon className="w-3 h-3 text-muted-foreground shrink-0" />}
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
        {label}
      </span>
    </div>
    {sensitive ? (
      <SensitiveText
        type="identifier"
        as="span"
        className={`text-[11px] font-medium text-right truncate text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value as string}
      </SensitiveText>
    ) : (
      <span
        className={`text-[11px] font-medium text-right truncate text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    )}
  </div>
);

const PlayerHoverCard = ({ player, children }: Props) => {
  const ids = parse(player.identifiers);
  const pingColor =
    player.ping <= 80
      ? "hsl(var(--green))"
      : player.ping <= 150
        ? "hsl(var(--yellow))"
        : "hsl(var(--red))";

  const hasAny =
    ids.steam || ids.discord || ids.license || ids.license2 || ids.fivem || ids.xbl || ids.live;

  return (
    <HoverCard openDelay={250} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-80 p-0 border-border/50 bg-card/95 backdrop-blur-md overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border/40 bg-background/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--green))] ring-2 ring-card" />
            <h4 className="text-sm font-semibold text-foreground truncate">{player.name}</h4>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
              #{player.id}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Wifi className="w-3 h-3" style={{ color: pingColor }} />
            <span className="text-[11px] font-mono tabular-nums" style={{ color: pingColor }}>
              {player.ping} ms
            </span>
          </div>
        </div>

        {hasAny ? (
          <div className="px-1 py-1">
            <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">
              Identifiers
            </div>
            {ids.steam64 && <Row label="Steam ID" value={ids.steam64} icon={UserIcon} sensitive />}
            {ids.steam && <Row label="Steam Hex" value={ids.steam} icon={Fingerprint} sensitive />}
            {ids.discord && <Row label="Discord ID" value={ids.discord} icon={Hash} sensitive />}
            {ids.license && (
              <Row label="Rockstar (license)" value={ids.license} icon={Gamepad2} sensitive />
            )}
            {ids.license2 && (
              <Row label="License 2" value={ids.license2} icon={Gamepad2} sensitive />
            )}
            {ids.fivem && <Row label="FiveM" value={ids.fivem} icon={Shield} sensitive />}
            {ids.xbl && <Row label="Xbox Live" value={ids.xbl} icon={Shield} sensitive />}
            {ids.live && <Row label="Live" value={ids.live} icon={Shield} sensitive />}
          </div>
        ) : (
          <div className="px-4 py-4 text-[11px] text-muted-foreground text-center">
            No identifiers exposed by this server.
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default PlayerHoverCard;
