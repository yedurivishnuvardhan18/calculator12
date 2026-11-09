import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeId =
  | "midnight-dark"
  | "pure-light"
  | "ocean-blue"
  | "emerald-green"
  | "lavender-dream"
  | "sunset"
  | "amoled-black"
  | "nord";

export type ThemePreference = ThemeId | "system";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  swatches: [string, string, string];
  isDark: boolean;
}

export const THEMES: ThemeMeta[] = [
  { id: "midnight-dark", name: "Midnight Dark", swatches: ["#0b1220", "#17243a", "#60a5fa"], isDark: true },
  { id: "pure-light", name: "Pure Light", swatches: ["#f8fafc", "#e9eef5", "#2563eb"], isDark: false },
  { id: "ocean-blue", name: "Ocean Blue", swatches: ["#edf7fc", "#d9edf7", "#087ca8"], isDark: false },
  { id: "emerald-green", name: "Emerald Green", swatches: ["#f0f8f3", "#dcefe3", "#187447"], isDark: false },
  { id: "lavender-dream", name: "Lavender Dream", swatches: ["#f7f4fc", "#eae3f8", "#7046b8"], isDark: false },
  { id: "sunset", name: "Sunset", swatches: ["#fff6f1", "#ffe4da", "#c43d2b"], isDark: false },
  { id: "amoled-black", name: "AMOLED Black", swatches: ["#000000", "#111111", "#00e5c4"], isDark: true },
  { id: "nord", name: "Nord", swatches: ["#2e3440", "#3b4252", "#88c0d0"], isDark: true },
];

const DEFAULT_THEME: ThemePreference = "pure-light";
const STORAGE_KEY = "gg_theme";
const THEME_IDS = THEMES.map(({ id }) => id);
const ALL_THEME_CLASSES = THEME_IDS.map((id) => `theme-${id}`);
const LEGACY_THEMES: Record<string, ThemeId> = {
  "forest-lime": "emerald-green",
  "sunny-brown": "sunset",
  "cosmic-violet": "lavender-dream",
  "luxury-gold": "pure-light",
};

interface ThemeContextType {
  theme: ThemeId;
  preference: ThemePreference;
  setTheme: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "pure-light",
  preference: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || (value !== null && THEME_IDS.includes(value as ThemeId));
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
    if (stored && Object.prototype.hasOwnProperty.call(LEGACY_THEMES, stored)) {
      return LEGACY_THEMES[stored];
    }
  } catch {
    return DEFAULT_THEME;
  }
  return DEFAULT_THEME;
}

function getSystemDarkPreference(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(preference: ThemePreference, systemDark: boolean): ThemeId {
  if (preference !== "system") return preference;
  return systemDark ? "midnight-dark" : "pure-light";
}

function applyTheme(preference: ThemePreference, systemDark: boolean): ThemeId {
  const theme = resolveTheme(preference, systemDark);
  const meta = THEMES.find((item) => item.id === theme);
  const root = document.documentElement;
  root.classList.remove(...ALL_THEME_CLASSES);
  root.classList.add(`theme-${theme}`);
  root.classList.toggle("dark", Boolean(meta?.isDark));
  root.dataset.theme = theme;
  root.style.colorScheme = meta?.isDark ? "dark" : "light";
  return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState(getSystemDarkPreference);
  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemPreference = (event: MediaQueryListEvent) => {
      applyTheme(preference, event.matches);
      setSystemDark(event.matches);
    };
    mediaQuery.addEventListener("change", updateSystemPreference);
    return () => mediaQuery.removeEventListener("change", updateSystemPreference);
  }, [preference]);

  useEffect(() => {
    applyTheme(preference, systemDark);

    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch (error) {
      console.warn("Could not save the selected theme preference.", error);
    }
  }, [preference, systemDark, theme]);

  const setTheme = useCallback((nextPreference: ThemePreference) => {
    applyTheme(nextPreference, getSystemDarkPreference());
    setPreference(nextPreference);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((current) => (resolveTheme(current, systemDark) === "midnight-dark" ? "pure-light" : "midnight-dark"));
  }, [systemDark]);

  const value = useMemo(
    () => ({ theme, preference, setTheme, toggleTheme }),
    [theme, preference, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
