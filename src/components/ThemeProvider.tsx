import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeId =
  | "forest-lime"
  | "sunny-brown"
  | "cosmic-violet"
  | "luxury-gold";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  swatch: string;
  isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
  { id: "forest-lime",   name: "Forest Lime",   swatch: "bg-[#0a2a1f]", isDark: true  },
  { id: "sunny-brown",   name: "Sunny Brown",   swatch: "bg-[#f4d03f]", isDark: false },
  { id: "cosmic-violet", name: "Cosmic Violet", swatch: "bg-[#0f0a1f]", isDark: true  },
  { id: "luxury-gold",   name: "Luxury Gold",   swatch: "bg-[#f5ebd6]", isDark: false },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  toggleTheme: () => void;
}

const DEFAULT_THEME: ThemeId = "cosmic-violet";
const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "gg_theme";
const ALL_THEME_CLASSES = THEMES.map((t) => `theme-${t.id}`);

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY) as string | null;
  if (stored && THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "luxury-gold";
  return DEFAULT_THEME;
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
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const idx = THEMES.findIndex((t) => t.id === prev);
      return THEMES[(idx + 1) % THEMES.length].id;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
