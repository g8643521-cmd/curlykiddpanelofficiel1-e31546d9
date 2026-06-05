// Deterministic placeholder data for player UI until real telemetry is wired up.
// All values are derived from the player's server id + name so they're stable across renders.

const JOBS = [
  "Police Officer",
  "Paramedic",
  "Mechanic",
  "Taxi Driver",
  "Unemployed",
  "Mayor",
  "Mafia",
  "Lawyer",
  "Firefighter",
  "Trucker",
];

const RANKS = ["Recruit", "Junior", "Member", "Senior", "Veteran", "Captain", "Chief"];

const COUNTRIES = [
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
];

const FIRST_NAMES = ["John", "Mike", "Anders", "Lars", "Erik", "Magnus", "Oliver", "Lukas", "Noah", "Emil"];
const LAST_NAMES = ["Hansen", "Nielsen", "Jensen", "Andersen", "Pedersen", "Smith", "Müller", "Kowalski", "Berg", "Lund"];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
};

export interface PlayerPlaceholder {
  discordUsername: string;
  discordId: string;
  rockstarName: string;
  steamName: string;
  firstSeen: string;
  lastSeen: string;
  lastSeenRaw: string;
  totalPlaytime: string;
  playtime30d: string;
  sessionTime: string;
  sessionMinutes: number;
  characterName: string;
  job: string;
  rank: string;
  warnings: number;
  kicks: number;
  bans: number;
  country: { code: string; name: string; flag: string };
}

export const getPlayerPlaceholder = (
  player: { id: number; name: string; identifiers?: string[] },
): PlayerPlaceholder => {
  const seed = hash(`${player.id}:${player.name}`);
  const r = (n: number) => Math.floor((seed / 7) % n);
  const r2 = (n: number) => Math.floor((seed / 13) % n);

  const totalMins = 600 + (seed % 50000);
  const sessionMins = 5 + (seed % 240);
  const last30 = Math.min(totalMins, 200 + (seed % 4000));
  const daysSinceFirst = 30 + (seed % 720);
  const firstSeenDate = new Date(Date.now() - daysSinceFirst * 86_400_000);

  const country = COUNTRIES[seed % COUNTRIES.length];

  // discord identifier if present
  const discordRaw = player.identifiers?.find((i) => i.startsWith("discord:"))?.replace("discord:", "");

  return {
    discordUsername: `${player.name.toLowerCase().replace(/\s+/g, "_")}`,
    discordId: discordRaw || `${1_000_000_000_000_000 + (seed % 8_999_999_999_999_999)}`,
    rockstarName: `RSG_${player.name.replace(/\s+/g, "")}`,
    steamName: player.name,
    firstSeen: firstSeenDate.toLocaleDateString(),
    lastSeen: "Online now",
    lastSeenRaw: "online",
    totalPlaytime: formatDuration(totalMins),
    playtime30d: formatDuration(last30),
    sessionTime: formatDuration(sessionMins),
    sessionMinutes: sessionMins,
    characterName: `${FIRST_NAMES[r(FIRST_NAMES.length)]} ${LAST_NAMES[r2(LAST_NAMES.length)]}`,
    job: JOBS[seed % JOBS.length],
    rank: RANKS[(seed >> 3) % RANKS.length],
    warnings: seed % 5,
    kicks: (seed >> 2) % 3,
    bans: 0,
    country,
  };
};
