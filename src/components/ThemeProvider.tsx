import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeId =
  | "exam-sheet"
  | "minimalist"
  | "slate"
  | "high-contrast"
  | "gameboy-night"
  | "terminal-doom"
  | "retro-98"
  | "arctic-pro"
  | "midnight-luxe"
  | "matrix-green"
  | "github-dark"
  | "parchment"
  | "cyber-violet"
  | "warm-paper"
  | "ocean-depth";

export interface ThemeGroup {
  isNew?: boolean;
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  /** Tailwind class for the swatch icon background. */
  swatch: string;
  /** Card background class for the picker card itself. */
  cardBg: string;
  /** Card text color class for the picker card. */
  cardText: string;
  /** Accent dot class. */
  accent: string;
  isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "exam-sheet",
    name: "Exam Sheet",
    description: "Marked paper, ruled margins, stamp-note energy.",
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
    swatch: "bg-black",
    cardBg: "bg-black",
    cardText: "text-white",
    accent: "bg-white",
    isDark: true,
  },
  {
    id: "gameboy-night",
    name: "Game Boy Night",
    description: "LCD cartridge glow, d-pad energy, handheld calm.",
    swatch: "bg-[#1a2410]",
    cardBg: "bg-[#1a2410]",
    cardText: "text-[#c6e84e]",
    accent: "bg-[#c6e84e]",
    isDark: true,
  },
  {
    id: "terminal-doom",
    name: "Terminal Doom",
    description: "Combat HUD, inferno panels, warning pulse.",
    swatch: "bg-[#1a0808]",
    cardBg: "bg-[#1a0808]",
    cardText: "text-[#ff6633]",
    accent: "bg-[#ff6633]",
    isDark: true,
  },
  {
    id: "retro-98",
    name: "Retro 98",
    description: "CRT desktop, teal workspace, dialog-box nostalgia.",
    swatch: "bg-[#c0c0c0]",
    cardBg: "bg-[#c0c0c0]",
    cardText: "text-black",
    accent: "bg-[#000080]",
    isDark: false,
  {
    id: "retro-98",
    name: "Retro 98",
    description: "CRT desktop, teal workspace, dialog-box nostalgia.",
    swatch: "bg-[#c0c0c0]",
    cardBg: "bg-[#c0c0c0]",
    cardText: "text-black",
    accent: "bg-[#000080]",
    isDark: false,
  },
  // ───────── MORE THEMES (new) ─────────
  {
    id: "arctic-pro",
    name: "Arctic Pro",
    description: "Apple-inspired. Clean. Premium light.",
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
    swatch: "bg-[#0F172A]",
    cardBg: "bg-[#1E293B]",
    cardText: "text-[#F1F5F9]",
    accent: "bg-[#38BDF8]",
    isDark: true,
  },
];

/** IDs considered "new" — rendered in second group with divider */
export const NEW_THEME_IDS: ReadonlyArray<ThemeId> = [
  "arctic-pro",
  "midnight-luxe",
  "matrix-green",
  "github-dark",
  "parchment",
  "cyber-violet",
  "warm-paper",
  "ocean-depth",
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

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "exam-sheet";
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  if (stored && THEMES.some((t) => t.id === stored)) return stored;
  // Auto-suggest based on system preference
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "minimalist";
  return "exam-sheet";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...ALL_THEME_CLASSES);
    root.classList.add(`theme-${theme}`);
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
