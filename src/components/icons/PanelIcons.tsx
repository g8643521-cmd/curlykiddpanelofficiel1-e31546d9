import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };

const base = (size: number | string = 20): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

/** Custom favorites icon — pinned star inside a rounded shield */
export const FavoritesGlyph: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M5 5.5C5 4.67 5.67 4 6.5 4h11c.83 0 1.5.67 1.5 1.5v12.2c0 1.06-1.18 1.7-2.06 1.12L12 16.5l-4.94 2.32C6.18 19.4 5 18.76 5 17.7V5.5Z" />
    <path d="m12 8.2 1.32 2.68 2.96.43-2.14 2.08.5 2.94L12 14.94l-2.64 1.39.5-2.94L7.72 11.3l2.96-.43L12 8.2Z" fill="currentColor" fillOpacity="0.18" />
  </svg>
);

/** Custom history icon — circular dial with offset tick */
export const HistoryGlyph: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.13" />
    <path d="M3.5 4.5v3.8h3.8" />
    <path d="M12 7.5V12l3 1.8" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

/** Custom mods icon — stacked isometric blocks */
export const ModsGlyph: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3 4 7.2v9.6L12 21l8-4.2V7.2L12 3Z" />
    <path d="M4 7.2 12 11.4l8-4.2" />
    <path d="M12 11.4V21" />
    <path d="m8 5.1 8 4.2" opacity="0.55" />
  </svg>
);
