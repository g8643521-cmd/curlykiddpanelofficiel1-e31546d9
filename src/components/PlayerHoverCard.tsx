import { ReactNode } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Hash,
  Gamepad2,
  User as UserIcon,
  Wifi,
  Shield,
  Fingerprint,
  ExternalLink,
  Copy,
  Check,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import SensitiveText from "./SensitiveText";

interface Props {
  player: { id: number; name: string; ping: number; identifiers?: string[] };
  joinOrder?: { rank: number; total: number };
  children: ReactNode;
}

interface ParsedIds {
  steam?: string;
  steam64?: string;
  discord?: string;
  license?: string;
  license2?: string;
  fivem?: string;
  xbl?: string;
  live?: string;
  [k: string]: string | undefined;
}

const parse = (ids: string[] = []): ParsedIds => {
  const out: ParsedIds = {};
  for (const id of ids) {
    const idx = id.indexOf(":");
    if (idx < 0) continue;
    const k = id.slice(0, idx);
    const v = id.slice(idx + 1);
    if (!(k in out)) out[k] = v;
  }
  if (out.steam && /^[0-9a-fA-F]+$/.test(out.steam)) {
    try {
      out.steam64 = BigInt("0x" + out.steam).toString();
    } catch {
      /* ignore */
    }
  }
  return out;
};

const pingClass = (ping: number) => {
  if (ping <= 50) return { label: "Excellent", color: "hsl(var(--green))" };
  if (ping <= 100) return { label: "Good", color: "hsl(var(--green))" };
  if (ping <= 150) return { label: "Moderate", color: "hsl(var(--yellow))" };
  return { label: "Poor", color: "hsl(var(--red))" };
};

const copy = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
};

const Row = ({
  label,
  value,
  icon: Icon,
  sensitive,
  mono = true,
  href,
  copyValue,
  copyLabel,
}: {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  sensitive?: boolean;
  mono?: boolean;
  href?: string;
  copyValue?: string;
  copyLabel?: string;
}) => {
  const valEl = sensitive ? (
    <SensitiveText
      type="identifier"
      as="span"
      className={`text-[11px] font-medium text-right truncate text-foreground ${mono ? "font-mono" : ""}`}
    >
      {value as string}
    </SensitiveText>
  ) : (
    <span className={`text-[11px] font-medium text-right truncate text-foreground ${mono ? "font-mono" : ""}`}>
      {value}
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-background/40 transition-colors group">
      <div className="flex items-center gap-1.5 min-w-0">
        {Icon && <Icon className="w-3 h-3 text-muted-foreground shrink-0" />}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1 min-w-0">
        {valEl}
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {copyValue && (
          <button
            onClick={() => copy(copyValue, copyLabel || label)}
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

const PresenceBadge = ({ label, present }: { label: string; present: boolean }) => (
  <span
    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
      present
        ? "bg-[hsl(var(--green))]/10 text-[hsl(var(--green))] border-[hsl(var(--green))]/25"
        : "bg-background/40 text-muted-foreground/60 border-border/30"
    }`}
  >
    {present ? <Check className="w-2.5 h-2.5" /> : <XIcon className="w-2.5 h-2.5" />}
    {label}
  </span>
);

const PlayerHoverCard = ({ player, joinOrder, children }: Props) => {
  const ids = parse(player.identifiers);
  const ping = pingClass(player.ping);

  const identifierCount = (player.identifiers || []).length;
  const types = (player.identifiers || [])
    .map((s) => s.split(":")[0])
    .filter((v, i, a) => v && a.indexOf(v) === i);

  // Primary identifier priority: license (Rockstar) > steam > discord > fivem > xbl > live
  const priority = ["license", "steam", "discord", "fivem", "xbl", "live", "license2"];
  const primary = priority.find((p) => ids[p]);

  const steamUrl = ids.steam64 ? `https://steamcommunity.com/profiles/${ids.steam64}` : null;
  const discordMention = ids.discord ? `<@${ids.discord}>` : null;
  const discordProfileUrl = ids.discord ? `https://discord.com/users/${ids.discord}` : null;
  const fivemForumUrl = ids.fivem ? `https://forum.cfx.re/u/${ids.fivem}` : null;

  const hasAny = identifierCount > 0;

  return (
    <HoverCard openDelay={250} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-96 p-0 border-border/50 bg-card/95 backdrop-blur-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/40 bg-background/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--green))] ring-2 ring-card" />
            <h4 className="text-sm font-semibold text-foreground truncate">{player.name}</h4>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">#{player.id}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1" style={{ color: ping.color }}>
              <Wifi className="w-3 h-3" />
              <span className="font-mono tabular-nums">{player.ping} ms</span>
              <span className="opacity-70">· {ping.label}</span>
            </span>
            {joinOrder && (
              <span className="text-muted-foreground font-mono tabular-nums border-l border-border/40 pl-3">
                Slot {joinOrder.rank}/{joinOrder.total}
              </span>
            )}
          </div>
        </div>

        {/* Presence badges */}
        <div className="px-3 py-2 border-b border-border/30 bg-background/10">
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1.5">
            Identifiers · {identifierCount} found{primary && ` · primary: ${primary}`}
          </div>
          <div className="flex flex-wrap gap-1">
            <PresenceBadge label="Steam" present={!!ids.steam} />
            <PresenceBadge label="Discord" present={!!ids.discord} />
            <PresenceBadge label="Rockstar" present={!!ids.license} />
            <PresenceBadge label="FiveM" present={!!ids.fivem} />
            <PresenceBadge label="Xbox" present={!!ids.xbl} />
            <PresenceBadge label="Live" present={!!ids.live} />
          </div>
        </div>

        {hasAny ? (
          <div className="px-1 py-1">
            {ids.steam64 && (
              <Row
                label="Steam ID"
                value={ids.steam64}
                icon={UserIcon}
                sensitive
                copyValue={ids.steam64}
                copyLabel="Steam ID"
              />
            )}
            {steamUrl && (
              <Row
                label="Steam Profile"
                value={`steamcommunity.com/profiles/${ids.steam64}`}
                icon={ExternalLink}
                mono={false}
                href={steamUrl}
                copyValue={steamUrl}
                copyLabel="Steam URL"
              />
            )}
            {ids.steam && <Row label="Steam Hex" value={ids.steam} icon={Fingerprint} sensitive copyValue={ids.steam} />}
            {ids.discord && (
              <Row
                label="Discord ID"
                value={ids.discord}
                icon={Hash}
                sensitive
                copyValue={ids.discord}
                copyLabel="Discord ID"
              />
            )}
            {discordMention && (
              <Row
                label="Mention"
                value={discordMention}
                icon={Hash}
                copyValue={discordMention}
                copyLabel="Discord mention"
              />
            )}
            {discordProfileUrl && (
              <Row
                label="Discord URL"
                value={`discord.com/users/${ids.discord}`}
                icon={ExternalLink}
                mono={false}
                href={discordProfileUrl}
                copyValue={discordProfileUrl}
                copyLabel="Discord URL"
              />
            )}
            {ids.license && (
              <Row label="Rockstar (license)" value={ids.license} icon={Gamepad2} sensitive copyValue={ids.license} />
            )}
            {ids.license2 && <Row label="License 2" value={ids.license2} icon={Gamepad2} sensitive copyValue={ids.license2} />}
            {ids.fivem && (
              <Row
                label="FiveM"
                value={ids.fivem}
                icon={Shield}
                sensitive
                href={fivemForumUrl || undefined}
                copyValue={ids.fivem}
              />
            )}
            {ids.xbl && <Row label="Xbox Live" value={ids.xbl} icon={Shield} sensitive copyValue={ids.xbl} />}
            {ids.live && <Row label="Live" value={ids.live} icon={Shield} sensitive copyValue={ids.live} />}

            {types.length > 0 && (
              <div className="px-3 py-1.5 border-t border-border/30 mt-1 flex items-center justify-between gap-2">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Types</span>
                <span className="text-[10px] font-mono text-foreground/80 truncate text-right">
                  {types.join(", ")}
                </span>
              </div>
            )}
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
