import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { THEMES, useTheme, type ThemeId } from "@/components/ThemeProvider";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemePanel({ open, onOpenChange }: ThemePanelProps) {
  const { theme, setTheme } = useTheme();

  // Close on Escape (Sheet handles this, but keep deterministic on first open)
  useEffect(() => {
    if (!open) return;
  }, [open]);

  const handleSelect = (id: ThemeId) => {
    setTheme(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-background border-l border-border"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-2xl font-display">
            <Sparkles className="w-5 h-5 text-primary" />
            Themes
          </SheetTitle>
          <SheetDescription>
            Pick a vibe. Your choice is saved automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {THEMES.map((t) => {
            const selected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id)}
                aria-pressed={selected}
                aria-label={`Apply ${t.name} theme`}
                className={cn(
                  "group relative flex items-stretch gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg",
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {/* Preview swatch */}
                <div
                  className={cn(
                    "relative w-20 h-20 rounded-xl border border-border/50 overflow-hidden shrink-0 transition-transform duration-300",
                    "group-hover:scale-105",
                    t.preview,
                  )}
                  aria-hidden="true"
                >
                  <span className={cn("absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full ring-2 ring-white/60", t.accent)} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-foreground truncate">
                      {t.name}
                    </h3>
                    {selected && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-snug">
                    {t.description}
                  </p>
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                    {t.isDark ? "Dark" : "Light"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          More themes coming soon ✨
        </p>
      </SheetContent>
    </Sheet>
  );
}
