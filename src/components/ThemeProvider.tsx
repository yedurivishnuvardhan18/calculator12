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
