import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { THEMES, NEW_THEME_IDS, useTheme, type ThemeId } from "@/components/ThemeProvider";
import {
  FileText, Circle, Layers, Square, Gamepad2, Terminal, Monitor,
  Snowflake, Crown, Code2, BookOpen, Cpu, Newspaper, Waves, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICONS: Record<ThemeId, typeof FileText> = {
  "exam-sheet": FileText,
  "minimalist": Circle,
  "slate": Layers,
  "high-contrast": Square,
  "gameboy-night": Gamepad2,
  "terminal-doom": Terminal,
  "retro-98": Monitor,
  "arctic-pro": Snowflake,
  "midnight-luxe": Crown,
  "matrix-green": Code2,
  "github-dark": Code2,
  "parchment": BookOpen,
  "cyber-violet": Cpu,
  "warm-paper": Newspaper,
  "ocean-depth": Waves,
};

export function ThemePanel({ open, onOpenChange }: ThemePanelProps) {
  const { theme, setTheme } = useTheme();

  const existingThemes = THEMES.filter((t) => !NEW_THEME_IDS.includes(t.id));
  const newThemes = THEMES.filter((t) => NEW_THEME_IDS.includes(t.id));

  const renderCard = (t: typeof THEMES[number]) => {
    const Icon = ICONS[t.id];
    const selected = theme === t.id;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => setTheme(t.id)}
        aria-pressed={selected}
        aria-label={`Apply ${t.name} theme`}
        className={cn(
          "group relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200",
          "hover:scale-[1.02]",
          t.cardBg,
          t.cardText,
          selected
            ? "border-foreground ring-2 ring-foreground/30 shadow-lg"
            : "border-transparent hover:border-foreground/30",
        )}
      >
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border",
            t.isDark ? "border-white/20 bg-white/10" : "border-black/15 bg-black/5",
          )}
          aria-hidden="true"
        >
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm tracking-wide uppercase truncate">
            {t.name}
          </h3>
          <p className="text-xs mt-0.5 leading-snug opacity-80">
            {t.description}
          </p>
        </div>
        {selected && (
          <div
            className={cn(
              "shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
              t.accent,
            )}
            aria-hidden="true"
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm overflow-y-auto bg-background border-l border-border p-5"
      >
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Themes
          </SheetTitle>
          <SheetDescription className="text-sm text-foreground/80">
            Select your preferred style.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          {existingThemes.map(renderCard)}

          {newThemes.length > 0 && (
            <div className="flex items-center gap-2 my-2" aria-hidden="true">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
                More Themes
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {newThemes.map(renderCard)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
