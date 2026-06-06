import { useState } from "react";
import {
  Users,
  ExternalLink,
  Copy,
  Gamepad2,
  AlertTriangle,
  Shield,
  MoreHorizontal,
  StickyNote,
  ChevronDown,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import AddCheaterDialog from "./AddCheaterDialog";
import PlayerNotesDialog from "./PlayerNotesDialog";
import PlayerHoverCard from "./PlayerHoverCard";
import SensitiveText from "./SensitiveText";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useStreamerMode } from "@/hooks/useStreamerMode";

// Shared grid template — used by row + header in ServerDetails to stay aligned.
export const PLAYER_ROW_GRID =
  "44px minmax(220px,2fr) minmax(140px,1.2fr) minmax(140px,1.2fr) minmax(140px,1.2fr) minmax(110px,1fr) 76px";


interface PlayerIdentifiers {
  steam?: string;
  steamHex?: string;
  discord?: string;
  fivem?: string;
  license?: string;
  license2?: string;
  xbl?: string;
  live?: string;
}

interface CheaterReport {
  id: string;
  player_name: string;
  reason: string;
  status: string;
}

interface Props {
  player: {
    id: number;
    name: string;
    ping: number;
    identifiers?: string[];
  };
  index: number;
  searchQuery?: string;
  cheaterReport?: CheaterReport | null;
  serverCode?: string;
  serverName?: string;
  onCheaterAdded?: () => void;
}

const parseIdentifiers = (identifiers: string[] = []): PlayerIdentifiers => {
  const result: PlayerIdentifiers = {};
  for (const id of identifiers) {
    if (id.startsWith("steam:")) {
      result.steamHex = id.replace("steam:", "");
      const hex = result.steamHex;
      if (hex && /^[0-9a-fA-F]+$/.test(hex)) {
        try {
          result.steam = BigInt("0x" + hex).toString();
        } catch {
          /* ignore */
        }
      }
    } else if (id.startsWith("discord:")) result.discord = id.replace("discord:", "");
    else if (id.startsWith("fivem:")) result.fivem = id.replace("fivem:", "");
    else if (id.startsWith("license2:")) result.license2 = id.replace("license2:", "");
    else if (id.startsWith("license:")) result.license = id.replace("license:", "");
    else if (id.startsWith("xbl:")) result.xbl = id.replace("xbl:", "");
    else if (id.startsWith("live:")) result.live = id.replace("live:", "");
  }
  return result;
};

const getSteamAvatarUrl = (steamId: string) =>
  `https://avatars.cloudflare.steamstatic.com/${steamId}_medium.jpg`;

const pingClassify = (ping: number) => {
  if (ping <= 50) return { label: "Excellent", bars: 4, color: "hsl(var(--green))" };
  if (ping <= 100) return { label: "Good", bars: 3, color: "hsl(var(--green))" };
  if (ping <= 150) return { label: "Moderate", bars: 2, color: "hsl(var(--yellow))" };
  return { label: "Poor", bars: 1, color: "hsl(var(--red))" };
};

// Highlight substring matches inside a name
const Highlight = ({ text, query }: { text: string; query?: string }) => {
  if (!query) return <>{text}</>;
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-[hsl(var(--green))]/25 text-foreground rounded-sm px-0.5">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
};

const PlayerRowCompact = ({
  player,
  index,
  searchQuery,
  cheaterReport,
  serverCode,
  serverName,
  onCheaterAdded,
}: Props) => {
  const [avatarError, setAvatarError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCheaterDialog, setShowCheaterDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const { isAdmin } = useAdminStatus();
  const { isEnabled: streamerMode } = useStreamerMode();

  const identifiers = parseIdentifiers(player.identifiers);
  const hasIdentifiers = Object.keys(identifiers).length > 0;
  const isCheater = !!cheaterReport;
  const ping = pingClassify(player.ping);

  const avatarUrl = identifiers.steam && !avatarError ? getSteamAvatarUrl(identifiers.steam) : null;

  const copyToClipboard = (text: string, label: string) => {
    if (streamerMode) {
      toast.error("Copying disabled in Streamer Mode");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const copyAllIdentifiers = () => {
    if (!hasIdentifiers) return;
    const parts: string[] = [];
    if (identifiers.steam) parts.push(`Steam: ${identifiers.steam}`);
    if (identifiers.discord) parts.push(`Discord: ${identifiers.discord}`);
    if (identifiers.fivem) parts.push(`FiveM: ${identifiers.fivem}`);
    if (identifiers.license) parts.push(`License: ${identifiers.license}`);
    copyToClipboard(parts.join("\n"), "All identifiers");
  };

  const cheaterAccent = isCheater
    ? cheaterReport!.status === "confirmed"
      ? "border-l-[hsl(var(--red))]"
      : "border-l-[hsl(var(--yellow))]"
    : "border-l-transparent";

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`group border-l-2 ${cheaterAccent} ${
              isCheater ? "bg-background/40" : "hover:bg-background/40"
            } transition-colors`}
          >
            {/* Row */}
            <div
              className="grid items-center gap-3 px-4 py-2.5 text-[11px]"
              style={{
                gridTemplateColumns: PLAYER_ROW_GRID,
              }}
            >
              {/* Index */}
              <div className="font-mono text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Name + avatar (hover card trigger) */}
              <PlayerHoverCard player={player}>
                <div className="flex items-center gap-2.5 min-w-0 cursor-default">
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-7 h-7 rounded-md object-cover border border-border/50"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-secondary/70 border border-border/50 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--green))] ring-2 ring-card" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        <Highlight text={player.name} query={searchQuery} />
                      </span>
                      {isCheater && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                cheaterReport!.status === "confirmed"
                                  ? "bg-[hsl(var(--red))]/15 text-[hsl(var(--red))]"
                                  : "bg-[hsl(var(--yellow))]/15 text-[hsl(var(--yellow))]"
                              }`}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {cheaterReport!.status === "confirmed" ? "Cheater" : "Suspect"}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{cheaterReport!.reason}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/80">#{player.id}</div>
                  </div>
                </div>
              </PlayerHoverCard>

              {/* Character */}
              <div className="truncate text-foreground/85">{placeholder.characterName}</div>

              {/* Job */}
              <div className="truncate">
                <span className="inline-block px-1.5 py-0.5 rounded bg-secondary/60 border border-border/30 text-[10px] text-foreground/85">
                  {placeholder.job}
                </span>
              </div>

              {/* Session Time */}
              <div className="font-mono tabular-nums text-foreground/80">{placeholder.sessionTime}</div>

              {/* Total Playtime */}
              <div className="font-mono tabular-nums text-foreground/80">{placeholder.totalPlaytime}</div>

              {/* Last Seen */}
              <div className="text-[10px] text-[hsl(var(--green))] uppercase tracking-wider truncate">
                {placeholder.lastSeen}
              </div>

              {/* Country */}
              <div className="truncate text-foreground/85">
                <span className="mr-1">{placeholder.country.flag}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{placeholder.country.code}</span>
              </div>

              {/* Ping */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-end gap-[2px] h-3" aria-hidden>
                  {[1, 2, 3, 4].map((b) => (
                    <div
                      key={b}
                      className="w-[3px] rounded-[1px]"
                      style={{
                        height: `${b * 25}%`,
                        background: b <= ping.bars ? ping.color : "hsl(var(--muted-foreground) / 0.25)",
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: ping.color }}>
                  {player.ping}
                  <span className="text-[9px] text-muted-foreground ml-0.5">ms</span>
                </span>
              </div>


              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                {hasIdentifiers && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpanded((v) => !v)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => copyToClipboard(player.name, "Player name")}>
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Copy name
                    </DropdownMenuItem>
                    {identifiers.steam && (
                      <DropdownMenuItem asChild>
                        <a
                          href={`https://steamcommunity.com/profiles/${identifiers.steam}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-2" /> Steam profile
                        </a>
                      </DropdownMenuItem>
                    )}
                    {hasIdentifiers && (
                      <DropdownMenuItem onClick={copyAllIdentifiers}>
                        <Copy className="w-3.5 h-3.5 mr-2" /> Copy all identifiers
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowNotesDialog(true)}>
                          <StickyNote className="w-3.5 h-3.5 mr-2" /> Player notes
                        </DropdownMenuItem>
                        {!isCheater && (
                          <DropdownMenuItem
                            onClick={() => setShowCheaterDialog(true)}
                            className="text-destructive focus:text-destructive"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Flag as cheater
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Expanded identifiers */}
            {expanded && hasIdentifiers && (
              <div className="px-4 pb-3 pt-1 grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {identifiers.steam && (
                  <a
                    href={`https://steamcommunity.com/profiles/${identifiers.steam}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-background/60 hover:bg-background border border-border/40 text-[11px] text-foreground/90"
                  >
                    <Shield className="w-3 h-3 text-[hsl(var(--green))]" />
                    <span className="truncate">Steam</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                  </a>
                )}
                {identifiers.discord && (
                  <button
                    onClick={() => copyToClipboard(identifiers.discord!, "Discord ID")}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-background/60 hover:bg-background border border-border/40 text-[11px] text-foreground/90"
                  >
                    <Shield className="w-3 h-3 text-[#5865F2]" />
                    <SensitiveText type="identifier" as="span" className="truncate">
                      Discord
                    </SensitiveText>
                    <Copy className="w-3 h-3 ml-auto text-muted-foreground" />
                  </button>
                )}
                {identifiers.fivem && (
                  <a
                    href={`https://forum.cfx.re/u/${identifiers.fivem}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-background/60 hover:bg-background border border-border/40 text-[11px] text-foreground/90"
                  >
                    <Gamepad2 className="w-3 h-3 text-[hsl(var(--orange))]" />
                    <span className="truncate">CFX.re</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                  </a>
                )}
                {identifiers.license && (
                  <button
                    onClick={() => copyToClipboard(identifiers.license!, "Rockstar License")}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-background/60 hover:bg-background border border-border/40 text-[11px] text-foreground/90"
                  >
                    <Shield className="w-3 h-3 text-muted-foreground" />
                    <SensitiveText type="identifier" as="span" className="truncate">
                      R* License
                    </SensitiveText>
                    <Copy className="w-3 h-3 ml-auto text-muted-foreground" />
                  </button>
                )}
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => copyToClipboard(player.name, "Player name")}>
            <Copy className="w-4 h-4 mr-2" /> Copy name
          </ContextMenuItem>
          {hasIdentifiers && (
            <>
              <ContextMenuItem onClick={copyAllIdentifiers}>
                <Copy className="w-4 h-4 mr-2" /> Copy all identifiers
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <ExternalLink className="w-4 h-4 mr-2" /> Open profile
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {identifiers.steam && (
                    <ContextMenuItem asChild>
                      <a
                        href={`https://steamcommunity.com/profiles/${identifiers.steam}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Steam
                      </a>
                    </ContextMenuItem>
                  )}
                  {identifiers.discord && (
                    <ContextMenuItem asChild>
                      <a
                        href={`https://discord.com/users/${identifiers.discord}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Discord
                      </a>
                    </ContextMenuItem>
                  )}
                  {identifiers.fivem && (
                    <ContextMenuItem asChild>
                      <a
                        href={`https://forum.cfx.re/u/${identifiers.fivem}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        FiveM forum
                      </a>
                    </ContextMenuItem>
                  )}
                </ContextMenuSubContent>
              </ContextMenuSub>
            </>
          )}
          {isAdmin && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => setShowNotesDialog(true)}>
                <StickyNote className="w-4 h-4 mr-2" /> Player notes
              </ContextMenuItem>
              {!isCheater && (
                <ContextMenuItem
                  onClick={() => setShowCheaterDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" /> Flag as cheater
                </ContextMenuItem>
              )}
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AddCheaterDialog
        open={showCheaterDialog}
        onOpenChange={setShowCheaterDialog}
        playerName={player.name}
        playerIdentifiers={identifiers}
        serverCode={serverCode}
        serverName={serverName}
        onSuccess={onCheaterAdded}
      />
      <PlayerNotesDialog
        open={showNotesDialog}
        onOpenChange={setShowNotesDialog}
        playerName={player.name}
        playerIdentifiers={identifiers}
        serverCode={serverCode}
        serverName={serverName}
      />
    </>
  );
};

export default PlayerRowCompact;
