/**
 * Returns the active theme's accent palette as resolved CSS color strings.
 * Reads the live --pop-* CSS variables from :root so charts & canvas-based
 * UIs (recharts, confetti) automatically follow the current theme.
 *
 * Falls back to safe defaults during SSR or when called before mount.
 */
const POP_VARS = [
  "--pop-pink",
  "--pop-yellow",
  "--pop-cyan",
  "--pop-purple",
  "--pop-orange",
  "--pop-green",
] as const;

const FALLBACK = ["#FF6B9D", "#FFE66D", "#4ECDC4", "#A855F7", "#FF8C42", "#10B981"];

export function getThemeChartColors(): string[] {
  if (typeof window === "undefined") return FALLBACK;
  const root = getComputedStyle(document.documentElement);
  return POP_VARS.map((v, i) => {
    const hsl = root.getPropertyValue(v).trim();
    return hsl ? `hsl(${hsl})` : FALLBACK[i];
  });
}

/** Resolve a single semantic token (e.g. "primary", "accent") to hsl(...). */
export function getThemeToken(name: string, fallback = "#000"): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  return v ? `hsl(${v})` : fallback;
}
