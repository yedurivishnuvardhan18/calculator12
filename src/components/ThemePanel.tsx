import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { THEMES, useTheme, type ThemeId, type ThemeMeta, type ThemeGroup } from "@/components/ThemeProvider";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUPS: { id: ThemeGroup; label: string; sub: string }[] = [
  { id: "layout", label: "Layout Themes", sub: "Different design language. Different layout, type, and shapes." },
  { id: "style", label: "Style Themes", sub: "Surface treatments and finishes." },
  { id: "color", label: "Color Themes", sub: "Curated palettes only." },
];

/**
 * Tiny inline SVG wireframe thumbnail per theme — visualises the LAYOUT,
 * not just the palette. 120×80 viewBox.
 */
function Wireframe({ id }: { id: ThemeId }) {
  const stroke = "currentColor";
  const sw = 1.2;
  switch (id) {
    case "exec":
      return (
        <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="4" y="4" width="112" height="6" />
          <rect x="4" y="16" width="54" height="60" />
          <rect x="62" y="16" width="54" height="28" />
          <rect x="62" y="48" width="54" height="28" />
        </svg>
      );
    case "editorial":
      return (
        <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke={stroke} strokeWidth={sw}>
          <line x1="34" y1="14" x2="86" y2="14" strokeWidth="2.4" />
          <line x1="38" y1="22" x2="82" y2="22" />
          <line x1="34" y1="32" x2="86" y2="32" />
          <line x1="34" y1="38" x2="86" y2="38" />
          <line x1="34" y1="44" x2="86" y2="44" />
          <circle cx="60" cy="56" r="0.8" fill={stroke} />
          <circle cx="56" cy="56" r="0.8" fill={stroke} />
          <circle cx="64" cy="56" r="0.8" fill={stroke} />
          <line x1="34" y1="64" x2="86" y2="64" />
          <line x1="34" y1="70" x2="86" y2="70" />
        </svg>
      );
    case "dashboard":
      return (
        <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="4" y="4" width="22" height="72" />
          <rect x="30" y="8" width="26" height="18" />
          <rect x="60" y="8" width="26" height="18" />
          <rect x="90" y="8" width="26" height="18" />
          <rect x="30" y="32" width="86" height="44" />
          <line x1="30" y1="42" x2="116" y2="42" />
          <line x1="30" y1="52" x2="116" y2="52" />
          <line x1="30" y1="62" x2="116" y2="62" />
        </svg>
      );
    case "handwritten":
      return (
        <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke={stroke} strokeWidth={sw}>
          <g transform="rotate(-1.5 60 40)">
            <rect x="20" y="12" width="80" height="56" rx="3" strokeDasharray="3 2" />
            <line x1="26" y1="24" x2="94" y2="24" strokeDasharray="2 2" />
            <line x1="26" y1="34" x2="94" y2="34" strokeDasharray="2 2" />
            <line x1="26" y1="44" x2="94" y2="44" strokeDasharray="2 2" />
            <line x1="26" y1="54" x2="78" y2="54" strokeDasharray="2 2" />
          </g>
        </svg>
      );
    case "brutalist":
      return (
        <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke={stroke} strokeWidth="2.2">
          <rect x="4" y="4" width="112" height="14" fill={stroke} />
          <rect x="4" y="22" width="36" height="54" />
          <rect x="42" y="22" width="36" height="54" />
          <rect x="80" y="22" width="36" height="54" />
        </svg>
      );
    case "zen":
      return (
        <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke={stroke} strokeWidth={sw}>
          <line x1="48" y1="24" x2="72" y2="24" />
          <line x1="44" y1="40" x2="76" y2="40" />
          <line x1="50" y1="56" x2="70" y2="56" />
        </svg>
      );
    default:
      // Style + color themes: simple stacked card sketch
      return (
        <svg viewBox="0 0 120 80" className="w-full h-full" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="10" y="10" width="100" height="14" rx="3" />
          <rect x="10" y="30" width="100" height="18" rx="3" />
          <rect x="10" y="54" width="62" height="14" rx="3" />
          <rect x="78" y="54" width="32" height="14" rx="3" />
        </svg>
      );
  }
}

export function ThemePanel({ open, onOpenChange }: ThemePanelProps) {
  const { theme, setTheme } = useTheme();

  const renderCard = (t: ThemeMeta) => {
    const selected = theme === t.id;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => setTheme(t.id)}
        aria-pressed={selected}
        aria-label={`Apply ${t.name} theme`}
        className={cn(
          "group relative flex flex-col gap-2 p-2.5 rounded-lg border-2 text-left transition-all duration-200",
          "hover:scale-[1.02]",
          t.cardBg,
          t.cardText,
          selected
            ? "border-foreground ring-2 ring-foreground/30 shadow-lg"
            : "border-transparent hover:border-foreground/30",
        )}
      >
        {/* Wireframe thumbnail */}
        <div
          className={cn(
            "relative w-full aspect-[3/2] rounded border overflow-hidden flex items-center justify-center opacity-80",
            t.isDark ? "border-white/15 bg-white/5" : "border-black/10 bg-black/[0.03]",
          )}
          aria-hidden="true"
        >
          <Wireframe id={t.id} />
          {selected && (
            <div
              className={cn(
                "absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center",
                t.accent,
              )}
            >
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Name + description */}
        <div className="min-w-0">
          <h3 className="font-bold text-[11px] tracking-[0.08em] uppercase truncate">
            {t.name}
          </h3>
          <p className="text-[10px] mt-0.5 leading-tight opacity-75 line-clamp-2">
            {t.description}
          </p>
        </div>
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-background border-l border-border p-5"
      >
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Themes
          </SheetTitle>
          <SheetDescription className="text-sm text-foreground/80">
            Each theme is a different design system — not just a color swap.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          {GROUPS.map((g) => {
            const items = THEMES.filter((t) => t.group === g.id);
            if (items.length === 0) return null;
            return (
              <section key={g.id}>
                <header className="mb-2.5">
                  <h2 className="text-[10px] font-black tracking-[0.22em] uppercase text-foreground">
                    {g.label}
                  </h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{g.sub}</p>
                  <div className="h-px bg-border mt-2" />
                </header>
                <div className="grid grid-cols-2 gap-2.5">
                  {items.map(renderCard)}
                </div>
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
