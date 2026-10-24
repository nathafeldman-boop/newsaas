import type { CSSProperties } from "react";

// Icônes au trait de l'appli (14/10) : remplacent les émojis (📍 🗓 ⏱ 💰
// ✨ 🔥 🎯 📄 👤) pour un rendu plus net et cohérent d'un téléphone à
// l'autre. Couleur héritée (currentColor), taille en pixels.
export type IconName =
  | "swipe"
  | "heart"
  | "dashboard"
  | "file"
  | "user"
  | "pin"
  | "calendar"
  | "clock"
  | "euro"
  | "sparkles"
  | "flame"
  | "x"
  | "send"
  | "target"
  | "pen"
  | "mic"
  | "mail"
  | "bell";

const PATHS: Record<IconName, string> = {
  swipe: "M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M9 2h8 M9 9h6 M9 13h4",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  dashboard: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z M14 3v5h5 M9 13h6 M9 17h4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21a8 8 0 0 1 16 0",
  pin: "M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  calendar: "M7 3v3 M17 3v3 M4 8h16 M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2",
  euro: "M17 6.5A7 7 0 0 0 7.5 12a7 7 0 0 0 9.5 5.5 M4 10h9 M4 14h9",
  sparkles: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z",
  flame: "M12 21c-3.9 0-7-2.8-7-6.7C5 10 9 8 9 4c2.5 1.5 4 3.6 4 6 1-.6 1.6-1.6 1.8-2.8C17.2 9 19 11.6 19 14.3 19 18.2 15.9 21 12 21Z",
  x: "M6 6l12 12 M18 6L6 18",
  send: "M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7Z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 12h.01",
  pen: "M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z M13.5 7.5l3 3",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3",
  mail: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z M22 7l-10 6L2 7",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0",
};

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.9,
  filled = false,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
