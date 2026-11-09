import { Fragment, useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Calculator, Menu, X, Globe, Target, ClipboardCheck, Palette, Eraser } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { GradeBattleModal } from "@/components/GradeBattleModal";
import { RoastModeModal } from "@/components/RoastModeModal";
import { ThemePanel } from "@/components/ThemePanel";
import { Course, calculateSGPA, createNewCourse } from "@/types/calculator";
import { clearAppCache } from "@/lib/app-cache";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navItems = [
  { to: "/", label: "Grade Calculator", icon: Calculator, end: true },
  { to: "/what-if", label: "CGPA Predictor", icon: Target },
  { to: "/attendance", label: "Attendance Calculator", icon: ClipboardCheck },
  // { to: "/external/feedback", label: "Feedback", icon: MessageSquare },
];

const externalLinks: { href: string; label: string; icon: typeof Globe }[] = [];

function loadCoursesFromStorage(): Course[] {
  try {
    const raw = localStorage.getItem("grade_calculator_state");
    if (!raw) return [createNewCourse()];
    const parsed = JSON.parse(raw);
    return parsed.courses || [createNewCourse()];
  } catch {
    return [createNewCourse()];
  }
}

export function Navbar() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [roastOpen, setRoastOpen] = useState(false);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [clearCacheOpen, setClearCacheOpen] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [courses, setCourses] = useState<Course[]>([createNewCourse()]);

  const activeIndex = navItems.findIndex((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobile) return;
    const el = navRefs.current[activeIndex];
    const container = containerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      });
    }
  }, [activeIndex, isMobile]);

  const checkGradesAndLaunch = (feature: "battle" | "roast") => {
    setMenuOpen(false);
    const freshCourses = loadCoursesFromStorage();
    setCourses(freshCourses);
    const validCourses = freshCourses.filter((c) => c.finalGradePoint !== null && c.name.trim() !== "");
    const result = calculateSGPA(validCourses);
    if (!result) {
      toast(
        feature === "battle"
          ? "Calculate your grades first to start a battle! 📊"
          : "Calculate your grades first to get roasted! 🔥",
        { duration: 3000 },
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (feature === "battle") setBattleOpen(true);
    else setRoastOpen(true);
  };

  const handleClearAppCache = async () => {
    setClearingCache(true);
    try {
      const deletedCount = await clearAppCache();
      toast.success(
        deletedCount > 0
          ? "App cache cleared. Reloading..."
          : "No app cache found. Reloading...",
      );
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Failed to clear app cache", error);
      toast.error(error instanceof Error ? error.message : "Could not clear the app cache.");
      setClearingCache(false);
    }
  };

  const openClearCacheDialog = () => {
    setMenuOpen(false);
    setClearCacheOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border overflow-x-hidden">
        <div
          ref={containerRef}
          className="container relative flex h-14 items-center justify-between md:justify-center gap-3 overflow-x-hidden"
        >
          {/* Animated active-route indicator — desktop only */}
          {!isMobile && activeIndex >= 0 && (
            <motion.div
              className="absolute top-0 h-[3px] rounded-b-full bg-primary"
              style={{
                boxShadow:
                  "0 0 8px 2px hsl(var(--primary) / 0.6), 0 0 20px 6px hsl(var(--primary) / 0.3)",
              }}
              animate={{ left: indicator.left, width: indicator.width }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}

          <img src="/logo.png" alt="GITAM Grade Calculator by TeamDino" className="w-8 h-8 rounded-full" />

          {/* Desktop nav */}
          {!isMobile &&
            navItems.map((item, i) => {
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <Fragment key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    ref={(el) => {
                      navRefs.current[i] = el;
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                  {item.to === "/attendance" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={openClearCacheDialog}
                      aria-label="Clear app cache"
                      className="gap-1.5 px-2 text-xs text-muted-foreground"
                    >
                      <Eraser className="h-4 w-4" />
                      <span>Clear cache</span>
                    </Button>
                  )}
                </Fragment>
              );
            })}

          {!isMobile &&
            externalLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            ))}

          <div className="flex items-center gap-1">
            {/* THEMES button */}
            <button
              onClick={() => setThemePanelOpen(true)}
              aria-label="Open themes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border-2 border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20 hover:border-primary/60 transition-all duration-200"
            >
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Themes</span>
            </button>

            {isMobile && (
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {isMobile && menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border bg-background"
            >
              <div className="container flex flex-col py-2 gap-1">
                {navItems.map((item) => {
                  const isActive = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                  return (
                    <Fragment key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? "text-foreground bg-muted"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                      {item.to === "/attendance" && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={openClearCacheDialog}
                          className="justify-start gap-3 px-4 py-3 text-sm text-muted-foreground"
                        >
                          <Eraser className="h-4 w-4" />
                          <span>Clear app cache</span>
                        </Button>
                      )}
                    </Fragment>
                  );
                })}

                {externalLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <ThemePanel open={themePanelOpen} onOpenChange={setThemePanelOpen} />
      <AlertDialog open={clearCacheOpen} onOpenChange={setClearCacheOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear app cache?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears cached app files used for offline loading, then reloads the app. Your saved grades,
              attendance, theme, and login data will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearingCache}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={clearingCache} onClick={handleClearAppCache}>
              {clearingCache ? "Clearing..." : "Clear cache"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <GradeBattleModal open={battleOpen} onOpenChange={setBattleOpen} courses={courses} />
      <RoastModeModal open={roastOpen} onOpenChange={setRoastOpen} courses={courses} />
    </>
  );
}
