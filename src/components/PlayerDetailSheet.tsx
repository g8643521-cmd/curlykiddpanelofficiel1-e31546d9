import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import SensitiveText from "./SensitiveText";
import { ReactNode, useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: { id: number; name: string; ping: number; identifiers?: string[] };
  joinOrder?: { rank: number; total: number };
  cheaterReason?: string | null;
  cheaterStatus?: string | null;
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
}

const parse = (ids: string[] = []): ParsedIds => {
  const out: ParsedIds = {};
  for (const id of ids) {
    const idx = id.indexOf(":");
    if (idx < 0) continue;
    const k = id.slice(0, idx) as keyof ParsedIds;
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
}: {
  label: string;
  value: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  sensitive?: boolean;
  mono?: boolean;
  href?: string;
  copyValue?: string;
}) => {
  const valEl = sensitive ? (
    <SensitiveText
      type="identifier"
      as="span"
      className={`text-xs font-medium text-right truncate text-foreground ${mono ? "font-mono" : ""}`}
    >
      {value as string}
    </SensitiveText>
  ) : (
    <span className={`text-xs font-medium text-right truncate text-foreground ${mono ? "font-mono" : ""}`}>
      {value}
    </span>
  );
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background/40 transition-colors group border-b border-border/20 last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {valEl}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-[hsl(var(--green))]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {copyValue && (
          <button
            onClick={() => copy(copyValue, label)}
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

const Presence = ({ label, present, color }: { label: string; present: boolean; color: string }) => (
  <div
    className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-md border ${
      present
        ? "bg-background/40 border-border/40"
        : "bg-background/20 border-border/20 opacity-50"
    }`}
  >
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{ background: present ? color : "hsl(var(--muted-foreground) / 0.2)" }}
    >
      {present ? (
        <Check className="w-3.5 h-3.5 text-background" />
      ) : (
        <XIcon className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </div>
    <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/80">{label}</span>
  </div>
);

const getSteamAvatarUrl = (steamId: string) =>
  `https://avatars.cloudflare.steamstatic.com/${steamId}_full.jpg`;

const PlayerDetailSheet = ({ open, onOpenChange, player, joinOrder, cheaterReason, cheaterStatus }: Props) => {
  const [avatarError, setAvatarError] = useState(false);
  const ids = parse(player.identifiers);
  const ping = pingClass(player.ping);
  const identifierCount = (player.identifiers || []).length;
  const types = (player.identifiers || [])
    .map((s) => s.split(":")[0])
    .filter((v, i, a) => v && a.indexOf(v) === i);

  const steamUrl = ids.steam64 ? `https://steamcommunity.com/profiles/${ids.steam64}` : null;
  const discordProfileUrl = ids.discord ? `https://discord.com/users/${ids.discord}` : null;
  const discordMention = ids.discord ? `<@${ids.discord}>` : null;
  const fivemForumUrl = ids.fivem ? `https://forum.cfx.re/u/${ids.fivem}` : null;
  const avatarUrl = ids.steam64 && !avatarError ? getSteamAvatarUrl(ids.steam64) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 border-border/40 bg-card/95 backdrop-blur-xl overflow-y-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{player.name}</SheetTitle>
        </SheetHeader>

        {/* Status accent */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[hsl(var(--green))] via-[hsl(var(--green))]/40 to-transparent" />

        {/* Profile Hero */}
        <div className="px-6 py-6 border-b border-border/30 bg-background/20">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  onError={() => setAvatarError(true)}
                  className="w-20 h-20 rounded-xl object-cover border border-border/50 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[hsl(var(--green))] ring-4 ring-card" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground truncate">{player.name}</h2>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums px-1.5 py-0.5 rounded bg-background/40 border border-border/30">
                  #{player.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5" style={{ color: ping.color }}>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums font-semibold">{player.ping} ms</span>
                  <span className="opacity-70">· {ping.label}</span>
                </span>
                {joinOrder && (
                  <span className="text-muted-foreground font-mono tabular-nums border-l border-border/40 pl-3">
                    Slot {joinOrder.rank}/{joinOrder.total}
                  </span>
                )}
                <span className="text-muted-foreground font-mono tabular-nums border-l border-border/40 pl-3">
                  {identifierCount} identifiers
                </span>
              </div>

              {cheaterReason && (
                <div
                  className={`mt-3 flex items-start gap-2 px-3 py-2 rounded-md border text-[11px] ${
                    cheaterStatus === "confirmed"
                      ? "bg-[hsl(var(--red))]/10 border-[hsl(var(--red))]/30 text-[hsl(var(--red))]"
                      : "bg-[hsl(var(--yellow))]/10 border-[hsl(var(--yellow))]/30 text-[hsl(var(--yellow))]"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold uppercase tracking-wider text-[10px]">
                      {cheaterStatus === "confirmed" ? "Confirmed cheater" : "Suspected cheater"}
                    </div>
                    <div className="opacity-90 mt-0.5">{cheaterReason}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick action buttons */}
          {(steamUrl || discordProfileUrl || fivemForumUrl) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
              {steamUrl && (
                <a
                  href={steamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[hsl(var(--green))]/10 border border-[hsl(var(--green))]/30 text-[hsl(var(--green))] hover:bg-[hsl(var(--green))]/15 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Steam Profile
                </a>
              )}
              {discordProfileUrl && (
                <a
                  href={discordProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/15 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Discord
                </a>
              )}
              {fivemForumUrl && (
                <a
                  href={fivemForumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[hsl(var(--orange))]/10 border border-[hsl(var(--orange))]/30 text-[hsl(var(--orange))] hover:bg-[hsl(var(--orange))]/15 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  CFX Forum
                </a>
              )}
            </div>
          )}
        </div>

        {/* Platform Presence */}
        <div className="px-6 py-4 border-b border-border/30">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
            Platform Presence
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            <Presence label="Steam" present={!!ids.steam} color="hsl(var(--green))" />
            <Presence label="Discord" present={!!ids.discord} color="#5865F2" />
            <Presence label="R*" present={!!ids.license} color="hsl(var(--orange))" />
            <Presence label="FiveM" present={!!ids.fivem} color="hsl(var(--yellow))" />
            <Presence label="Xbox" present={!!ids.xbl} color="hsl(var(--green))" />
            <Presence label="Live" present={!!ids.live} color="hsl(var(--green))" />
          </div>
        </div>

        {/* Identifiers */}
        {identifierCount > 0 ? (
          <div className="px-2 py-2">
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Identifiers
            </div>
            <div className="rounded-md border border-border/30 bg-background/20 overflow-hidden">
              {ids.steam64 && (
                <Row label="Steam64" value={ids.steam64} icon={UserIcon} sensitive copyValue={ids.steam64} />
              )}
              {steamUrl && (
                <Row
                  label="Steam Profile URL"
                  value={`steamcommunity.com/profiles/${ids.steam64}`}
                  icon={ExternalLink}
                  mono={false}
                  href={steamUrl}
                  copyValue={steamUrl}
                />
              )}
              {ids.steam && (
                <Row label="Steam Hex" value={ids.steam} icon={Fingerprint} sensitive copyValue={ids.steam} />
              )}
              {ids.discord && (
                <Row label="Discord ID" value={ids.discord} icon={Hash} sensitive copyValue={ids.discord} />
              )}
              {discordMention && (
                <Row label="Discord Mention" value={discordMention} icon={Hash} copyValue={discordMention} />
              )}
              {discordProfileUrl && (
                <Row
                  label="Discord URL"
                  value={`discord.com/users/${ids.discord}`}
                  icon={ExternalLink}
                  mono={false}
                  href={discordProfileUrl}
                  copyValue={discordProfileUrl}
                />
              )}
              {ids.license && (
                <Row label="Rockstar License" value={ids.license} icon={Gamepad2} sensitive copyValue={ids.license} />
              )}
              {ids.license2 && (
                <Row label="License 2" value={ids.license2} icon={Gamepad2} sensitive copyValue={ids.license2} />
              )}
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
            </div>

            {types.length > 0 && (
              <div className="px-4 py-3 mt-2 flex items-center justify-between gap-2 bg-background/20 rounded-md border border-border/30">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Identifier Types</span>
                <span className="text-[11px] font-mono text-foreground/80 truncate text-right">
                  {types.join(" · ")}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-8 text-xs text-muted-foreground text-center">
            No identifiers exposed by this server.
          </div>
        )}

        {/* Connection */}
        <div className="px-2 pb-6">
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Connection
          </div>
          <div className="rounded-md border border-border/30 bg-background/20 overflow-hidden">
            <Row label="Server ID" value={`#${player.id}`} icon={Hash} />
            <Row label="Ping" value={`${player.ping} ms`} icon={Wifi} />
            <Row label="Quality" value={ping.label} icon={Wifi} mono={false} />
            {joinOrder && (
              <Row label="Slot" value={`${joinOrder.rank} / ${joinOrder.total}`} icon={Users} />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlayerDetailSheet;
