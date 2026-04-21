import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeId =
  | "light"
  | "dark"
  | "glassmorphism"
  | "neumorphism"
  | "cyberpunk"
  | "aurora"
  | "amoled"
  | "pastel"
  | "retro";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  /** Tailwind background class for the preview swatch. Uses arbitrary values so it works pre-injection. */
  preview: string;
  /** Optional accent dot color. */
  accent: string;
  isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "light",
    name: "Classic Light",
    description: "Clean, bright and familiar.",
    preview: "bg-[hsl(240,20%,99%)]",
    accent: "bg-[hsl(243,75%,59%)]",
    isDark: false,
  },
  {
    id: "dark",
    name: "Classic Dark",
    description: "Deep navy with indigo accents.",
    preview: "bg-[hsl(240,15%,8%)]",
    accent: "bg-[hsl(243,80%,68%)]",
    isDark: true,
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Frosted layers, modern blur elegance.",
    preview: "bg-[linear-gradient(135deg,#a8c0ff,#3f2b96)]",
    accent: "bg-white/70 backdrop-blur",
    isDark: false,
  },
  {
    id: "neumorphism",
    name: "Neumorphism",
    description: "Soft shadows, tactile UI.",
    preview: "bg-[hsl(220,15%,90%)]",
    accent: "bg-[hsl(220,10%,75%)]",
    isDark: false,
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon grids, futuristic energy.",
    preview: "bg-[#0a001a]",
    accent: "bg-[#ff007a]",
    isDark: true,
  },
  {
    id: "aurora",
    name: "Aurora Gradient",
    description: "Dynamic gradients, vibrant flow.",
    preview: "bg-[linear-gradient(135deg,#7e22ce,#2563eb,#0d9488)]",
    accent: "bg-[#22d3ee]",
    isDark: true,
  },
  {
    id: "amoled",
    name: "AMOLED Dark",
    description: "True black, sleek and efficient.",
    preview: "bg-black",
    accent: "bg-[hsl(168,72%,40%)]",
    isDark: true,
  },
  {
    id: "pastel",
    name: "Pastel Dream",
    description: "Calm tones, soft visuals.",
    preview: "bg-[linear-gradient(135deg,#fbcfe8,#bae6fd,#a7f3d0)]",
    accent: "bg-[hsl(330,80%,80%)]",
    isDark: false,
  },
  {
    id: "retro",
    name: "Retro Pixel",
    description: "Old-school gaming nostalgia.",
    preview: "bg-[#2d1b69]",
    accent: "bg-[#f9c80e]",
    isDark: true,
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  /** Legacy: kept so old <ThemeProvider/> consumers don't break. Toggles between light & dark. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "gg_theme";
const ALL_THEME_CLASSES = THEMES.map((t) => `theme-${t.id}`);

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  if (stored && THEMES.some((t) => t.id === stored)) return stored;
  // Migrate from old "theme" key
  const legacy = localStorage.getItem("theme");
  if (legacy === "light" || legacy === "dark") return legacy;
  // Auto-suggest from system preference
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    // Remove every theme class then add the active one
    root.classList.remove(...ALL_THEME_CLASSES);
    root.classList.add(`theme-${theme}`);
    // Keep .dark in sync for any tailwind dark: utilities still in use
    const meta = THEMES.find((t) => t.id === theme);
    root.classList.toggle("dark", !!meta?.isDark);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => setThemeState(id), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (THEMES.find((t) => t.id === prev)?.isDark ? "light" : "dark")),
    [],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
