import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { THEMES, useTheme } from "@/components/ThemeProvider";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemePanel({ open, onOpenChange }: ThemePanelProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm overflow-y-auto bg-background border-l border-border p-5"
      >
        <SheetHeader className="text-left mb-5">
          <SheetTitle className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Themes
          </SheetTitle>
          <SheetDescription className="text-sm text-foreground/80">
            Pick a theme — the entire app updates instantly.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2">
          {THEMES.map((t) => {
            const selected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={selected}
                aria-label={`Apply ${t.name} theme`}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all duration-200",
                  "bg-card text-card-foreground hover:border-primary/60",
                  selected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border",
                )}
              >
                <span
                  className={cn("w-8 h-8 rounded-md border border-border flex-shrink-0", t.swatch)}
                  aria-hidden="true"
                />
                <span className="flex-1 font-semibold text-sm">{t.name}</span>
                {selected && (
                  <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
