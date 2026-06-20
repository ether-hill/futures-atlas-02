/*
 * The token registry — the canonical list of editable semantic tokens.
 * Drives the style-guide controls AND the override-CSS builder. Keep in sync
 * with the defaults in tokens.css.
 */

export type ControlKind = "color" | "font" | "px" | "text";
export type Mode = "light" | "dark";

export interface TokenDef {
  id: string; // unique key in the store, e.g. "bg" / "bg-dark"
  label: string;
  cssVar: string; // the semantic CSS custom property this sets
  group: string;
  control: ControlKind;
  mode?: Mode; // colours only; absent = applies in both modes (:root)
  default: string; // the tokens.css default (for reset + display)
  min?: number;
  max?: number;
  step?: number; // px controls
  options?: { label: string; value: string }[]; // font controls
}

const FONT_OPTIONS = [
  { label: "Archivo", value: "var(--fa-font-display)" },
  { label: "Bodoni Moda", value: "'Bodoni Moda', Georgia, serif" },
  { label: "Saira Condensed", value: "'Saira Condensed', 'Arial Narrow', sans-serif" },
  { label: "IBM Plex Mono", value: "var(--fa-font-mono)" },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "System sans", value: "system-ui, sans-serif" },
];

// colour pairs: [light default, dark default]
const COLOURS: [string, string, string, string][] = [
  // id-base, cssVar, light, dark
  ["bg", "--bg", "#f4efe4", "#211e18"],
  ["panel", "--panel", "#fbf8f0", "#2b2722"],
  ["haze", "--haze", "#ece4d4", "#16130f"],
  ["band", "--band", "#211e18", "#17140f"],
  ["text", "--text", "#211e18", "#f2ede2"],
  ["text-body", "--text-body", "#3a352b", "#d3ccbe"],
  ["muted", "--muted", "#6b6456", "#a69f91"],
  ["faint", "--faint", "#9a9484", "#7d7668"],
  ["accent", "--accent", "oklch(0.55 0.13 245)", "oklch(0.64 0.13 245)"],
  ["accent-soft", "--accent-soft", "oklch(0.93 0.045 245)", "oklch(0.34 0.06 245)"],
  ["accent-deep", "--accent-deep", "oklch(0.42 0.11 245)", "oklch(0.74 0.12 245)"],
];

const colourTokens: TokenDef[] = COLOURS.flatMap(([base, cssVar, light, dark]) => [
  { id: base, label: prettify(base), cssVar, group: "Colour", control: "color", mode: "light", default: light },
  { id: `${base}-dark`, label: prettify(base), cssVar, group: "Colour", control: "color", mode: "dark", default: dark },
]);

const px = (
  id: string,
  cssVar: string,
  group: string,
  def: string,
  min: number,
  max: number,
  step = 1,
): TokenDef => ({ id, label: prettify(id), cssVar, group, control: "px", default: def, min, max, step });

export const TOKENS: TokenDef[] = [
  // colour (light + dark) + the single always-light paper
  ...colourTokens,
  { id: "paper", label: "Paper (on-dark)", cssVar: "--paper", group: "Colour", control: "color", default: "#f4efe4" },

  // fonts
  { id: "font-heading", label: "Heading", cssVar: "--font-heading", group: "Typography", control: "font", default: "var(--fa-font-display)", options: FONT_OPTIONS },
  { id: "font-serif", label: "Serif / voice", cssVar: "--font-serif", group: "Typography", control: "font", default: "var(--fa-font-serif)", options: FONT_OPTIONS },
  { id: "font-year", label: "Numerals", cssVar: "--font-year", group: "Typography", control: "font", default: "var(--fa-font-year)", options: FONT_OPTIONS },
  { id: "font-mono", label: "Body / mono", cssVar: "--font-mono", group: "Typography", control: "font", default: "var(--fa-font-mono)", options: FONT_OPTIONS },

  // type sizes (px control replaces the responsive clamp default)
  px("text-display-xl", "--text-display-xl", "Type scale", "clamp(40px, 7.5vw, 120px)", 40, 160),
  px("text-display-l", "--text-display-l", "Type scale", "clamp(34px, 6vw, 92px)", 32, 120),
  px("text-display-m", "--text-display-m", "Type scale", "clamp(32px, 4.6vw, 68px)", 24, 96),
  px("text-display-s", "--text-display-s", "Type scale", "clamp(24px, 3.4vw, 44px)", 20, 72),
  px("text-title", "--text-title", "Type scale", "clamp(22px, 2.6vw, 32px)", 16, 48),
  px("text-title-s", "--text-title-s", "Type scale", "clamp(17px, 1.9vw, 24px)", 14, 36),
  px("text-lead", "--text-lead", "Type scale", "clamp(15px, 1.5vw, 19px)", 13, 28),
  px("text-body-size", "--text-body-size", "Type scale", "clamp(13px, 1.35vw, 16px)", 11, 20),
  px("text-stat", "--text-stat", "Type scale", "clamp(54px, 7vw, 96px)", 32, 140),
  px("text-label", "--text-label", "Type scale", "11px", 8, 16),

  // layout
  px("container-max", "--container-max", "Layout", "1500px", 800, 2200, 10),
  px("gutter", "--gutter", "Layout", "clamp(20px, 5vw, 56px)", 8, 120),

  // spacing
  px("space-section", "--space-section", "Spacing", "clamp(58px, 9vw, 130px)", 24, 220),
  px("space-header", "--space-header", "Spacing", "clamp(44px, 7vw, 96px)", 16, 160),
  px("space-card", "--space-card", "Spacing", "clamp(20px, 3vw, 28px)", 8, 64),
  px("space-card-l", "--space-card-l", "Spacing", "clamp(28px, 4vw, 44px)", 12, 80),

  // radii
  px("radius", "--radius", "Radius", "2px", 0, 24),
  px("radius-input", "--radius-input", "Radius", "3px", 0, 24),
  px("radius-menu", "--radius-menu", "Radius", "4px", 0, 24),

  // borders
  px("border-hairline", "--border-hairline", "Border", "1px", 0, 6, 0.5),
  px("border-emphasis", "--border-emphasis", "Border", "1.5px", 0, 6, 0.5),
  px("border-strong", "--border-strong", "Border", "2px", 0, 8, 0.5),
  px("border-rule", "--border-rule", "Border", "3px", 0, 10, 0.5),
];

export const GROUPS = ["Colour", "Typography", "Type scale", "Layout", "Spacing", "Radius", "Border"];

export function tokenById(id: string): TokenDef | undefined {
  return TOKENS.find((t) => t.id === id);
}

function prettify(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
