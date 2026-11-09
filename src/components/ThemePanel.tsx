import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { THEMES, useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const appearanceOptions = [
  { label: "Light", icon: Sun, value: "pure-light" as const },
  { label: "Dark", icon: Moon, value: "midnight-dark" as const },
  { label: "System", icon: Monitor, value: "system" as const },
];

export function ThemePanel({ open, onOpenChange }: ThemePanelProps) {
  const { theme, preference, setTheme } = useTheme();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l border-border bg-background p-5 sm:max-w-md sm:p-6"
      >
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="text-xl font-semibold tracking-tight">Appearance</SheetTitle>
          <SheetDescription>
            Choose a color theme. Your preference is saved on this device.
          </SheetDescription>
        </SheetHeader>

        <section aria-labelledby="appearance-mode-heading" className="mb-7">
          <h2 id="appearance-mode-heading" className="mb-3 text-sm font-medium text-foreground">
            Color mode
          </h2>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/50 p-1">
            {appearanceOptions.map(({ label, icon: Icon, value }) => {
              const selected = preference === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            System follows your device setting and switches between Midnight Dark and Pure Light.
          </p>
        </section>

        <section aria-labelledby="color-theme-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="color-theme-heading" className="text-sm font-medium text-foreground">
              Color themes
            </h2>
            <span className="text-xs text-muted-foreground">8 themes</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((item) => {
              const selected = preference === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  aria-pressed={selected}
                  aria-label={`Apply ${item.name} theme`}
                  className={cn(
                    "group relative flex min-h-28 flex-col justify-between overflow-hidden rounded-xl border bg-card p-3 text-left",
                    "transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/50",
                  )}
                >
                  <span
                    className="flex h-9 w-full overflow-hidden rounded-lg border border-border/70"
                    aria-hidden="true"
                  >
                    {item.swatches.map((color) => (
                      <span key={color} className="h-full flex-1" style={{ backgroundColor: color }} />
                    ))}
                  </span>
                  <span className="mt-3 flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-medium text-card-foreground">{item.name}</span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
}
