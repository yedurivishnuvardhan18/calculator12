import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeGroup = "layout" | "style" | "color";

export type ThemeId =
  // ── LAYOUT THEMES (new, redesign the whole app) ──
  | "exec"
  | "editorial"
  | "dashboard"
  | "handwritten"
  | "brutalist"
  | "zen"
  // ── STYLE THEMES (existing core) ──
  | "exam-sheet"
  | "minimalist"
  | "slate"
  | "high-contrast"
  | "retro-98"
  // ── COLOR THEMES (curated palettes) ──
  | "arctic-pro"
  | "midnight-luxe"
  | "matrix-green"
  | "github-dark"
  | "parchment"
  | "cyber-violet"
  | "warm-paper"
  | "ocean-depth";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  group: ThemeGroup;
  swatch: string;
  cardBg: string;
  cardText: string;
  accent: string;
  isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
  // ───────── LAYOUT THEMES ─────────
  {
    id: "exec",
    name: "Exec",
    description: "Corporate report. Wide. Sharp. Dense.",
    group: "layout",
    swatch: "bg-[#f4f4f4]",
    cardBg: "bg-[#ffffff]",
    cardText: "text-[#0a0a0a]",
    accent: "bg-[#0a0a0a]",
    isDark: false,
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Magazine article. Serif. Spacious. Centered.",
    group: "layout",
    swatch: "bg-[#fbf8f3]",
    cardBg: "bg-[#fbf8f3]",
    cardText: "text-[#1a1a1a]",
    accent: "bg-[#8b1a1a]",
    isDark: false,
  },
  {
    id: "dashboard",
    name: "Dashboard",
    description: "SaaS product UI. Compact. Data-first.",
    group: "layout",
    swatch: "bg-[#fafbfc]",
    cardBg: "bg-[#ffffff]",
    cardText: "text-[#0f172a]",
    accent: "bg-[#3b82f6]",
    isDark: false,
  },
  {
    id: "handwritten",
    name: "Handwritten",
    description: "Notebook study notes. Hand-drawn. Tilted.",
    group: "layout",
    swatch: "bg-[#fffdf7]",
    cardBg: "bg-[#fffdf7]",
    cardText: "text-[#2b2b2b]",
    accent: "bg-[#1e6fd9]",
    isDark: false,
  },
  {
    id: "brutalist",
    name: "Brutalist",
    description: "Raw newspaper. Heavy. Uppercase. Black borders.",
    group: "layout",
    swatch: "bg-[#f5f1e8]",
    cardBg: "bg-[#f5f1e8]",
    cardText: "text-[#000000]",
    accent: "bg-[#000000]",
    isDark: false,
  },
  {
    id: "zen",
    name: "Minimal Zen",
    description: "Empty. Calm. Focused. Whitespace as design.",
    group: "layout",
    swatch: "bg-[#fafafa]",
    cardBg: "bg-[#ffffff]",
    cardText: "text-[#262626]",
    accent: "bg-[#262626]",
    isDark: false,
  },

  // ───────── STYLE THEMES ─────────
  {
    id: "exam-sheet",
    name: "Exam Sheet",
    description: "Marked paper, ruled margins, stamp-note energy.",
    group: "style",
    swatch: "bg-[#fdf6e3]",
    cardBg: "bg-[#fdf6e3]",
    cardText: "text-[#2b1d0e]",
    accent: "bg-[#d2451e]",
    isDark: false,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Quiet, fluid, premium.",
    group: "style",
    swatch: "bg-[#0a0a0a]",
    cardBg: "bg-[#111111]",
    cardText: "text-white",
    accent: "bg-white",
    isDark: true,
  },
  {
    id: "slate",
    name: "Slate",
    description: "Calm, neutral, familiar.",
    group: "style",
    swatch: "bg-[#1e2a3a]",
    cardBg: "bg-[#1e2a3a]",
    cardText: "text-white",
    accent: "bg-[#3b82f6]",
    isDark: true,
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Raw, bold, high contrast.",
    group: "style",
    swatch: "bg-black",
    cardBg: "bg-black",
    cardText: "text-white",
    accent: "bg-white",
    isDark: true,
  },
  {
    id: "retro-98",
    name: "Retro 98",
    description: "CRT desktop, teal workspace, dialog-box nostalgia.",
    group: "style",
    swatch: "bg-[#c0c0c0]",
    cardBg: "bg-[#c0c0c0]",
    cardText: "text-black",
    accent: "bg-[#000080]",
    isDark: false,
  },

  // ───────── COLOR THEMES ─────────
  {
    id: "arctic-pro",
    name: "Arctic Pro",
    description: "Apple-inspired. Clean. Premium light.",
    group: "color",
    swatch: "bg-[#F5F5F7]",
    cardBg: "bg-[#FFFFFF]",
    cardText: "text-[#1D1D1F]",
    accent: "bg-[#0071E3]",
    isDark: false,
  },
  {
    id: "midnight-luxe",
    name: "Midnight Luxe",
    description: "Luxury brand editorial dark elegance.",
    group: "color",
    swatch: "bg-[#0A0A0F]",
    cardBg: "bg-[#12121A]",
    cardText: "text-[#E8D5B7]",
    accent: "bg-[#C9A96E]",
    isDark: true,
  },
  {
    id: "matrix-green",
    name: "Matrix Green",
    description: "Hacker terminal, retro-futurist mono.",
    group: "color",
    swatch: "bg-[#001A0D]",
    cardBg: "bg-[#002910]",
    cardText: "text-[#00FF88]",
    accent: "bg-[#00FF88]",
    isDark: true,
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    description: "Developer tools. Familiar. Functional.",
    group: "color",
    swatch: "bg-[#0D1117]",
    cardBg: "bg-[#161B22]",
    cardText: "text-[#E6EDF3]",
    accent: "bg-[#58A6FF]",
    isDark: true,
  },
  {
    id: "parchment",
    name: "Parchment",
    description: "Old library scholarly serif warmth.",
    group: "color",
    swatch: "bg-[#FDF6EC]",
    cardBg: "bg-[#FAF0DC]",
    cardText: "text-[#3B2A1A]",
    accent: "bg-[#8B4513]",
    isDark: false,
  },
  {
    id: "cyber-violet",
    name: "Cyber Violet",
    description: "Sci-fi futuristic neon gaming UI.",
    group: "color",
    swatch: "bg-[#1A1A2E]",
    cardBg: "bg-[#16213E]",
    cardText: "text-[#E2D9F3]",
    accent: "bg-[#C084FC]",
    isDark: true,
  },
  {
    id: "warm-paper",
    name: "Warm Paper",
    description: "Editorial magazine, warm minimal human.",
    group: "color",
    swatch: "bg-[#F8F4F0]",
    cardBg: "bg-[#FDFAF7]",
    cardText: "text-[#2C1810]",
    accent: "bg-[#C2440E]",
    isDark: false,
  },
  {
    id: "ocean-depth",
    name: "Ocean Depth",
    description: "SaaS dashboard. Deep blue ocean.",
    group: "color",
    swatch: "bg-[#0F172A]",
    cardBg: "bg-[#1E293B]",
    cardText: "text-[#F1F5F9]",
    accent: "bg-[#38BDF8]",
    isDark: true,
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "exam-sheet",
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "gg_theme";
const ALL_THEME_CLASSES = THEMES.map((t) => `theme-${t.id}`);
// Themes that have been removed — migrate users away from them silently.
const REMOVED_IDS = new Set(["gameboy-night", "terminal-doom"]);

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "exam-sheet";
  const stored = localStorage.getItem(STORAGE_KEY) as string | null;
  if (stored && !REMOVED_IDS.has(stored) && THEMES.some((t) => t.id === stored)) {
    return stored as ThemeId;
  }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "minimalist";
  return "exam-sheet";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...ALL_THEME_CLASSES);
    root.classList.add(`theme-${theme}`);
    root.setAttribute("data-theme", theme);
    const meta = THEMES.find((t) => t.id === theme);
    root.classList.toggle("dark", !!meta?.isDark);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => setThemeState(id), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (THEMES.find((t) => t.id === prev)?.isDark ? "exam-sheet" : "minimalist")),
    [],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
