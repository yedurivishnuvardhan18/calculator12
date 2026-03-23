import { NavLink, useLocation } from "react-router-dom";
import { Calculator, CheckSquare, Sun, Moon, Menu, X, Globe, MessageSquare, Coffee, Sparkles, ChevronDown, Swords, Flame, Target, ClipboardCheck } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { GradeBattleModal } from "@/components/GradeBattleModal";
import { RoastModeModal } from "@/components/RoastModeModal";
import { Course, calculateSGPA, createNewCourse } from "@/types/calculator";

const navItems = [
  { to: "/", label: "Grade Calculator", icon: Calculator, end: true },
  { to: "/what-if", label: "CGPA Predictor", icon: Target },
  { to: "/attendance", label: "Attendance Calculator", icon: ClipboardCheck },
  { to: "/habits", label: "Habit Tracker", icon: CheckSquare },
  { to: "/external/feedback", label: "Feedback", icon: MessageSquare },
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
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [mobileExtraOpen, setMobileExtraOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [roastOpen, setRoastOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([createNewCourse()]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeIndex = navItems.findIndex((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setExtraOpen(false);
    setMobileExtraOpen(false);
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

  // Close dropdown on outside click
  useEffect(() => {
    if (!extraOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExtraOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [extraOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!extraOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExtraOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [extraOpen]);

  const checkGradesAndLaunch = (feature: "battle" | "roast") => {
    setExtraOpen(false);
    setMenuOpen(false);
    setMobileExtraOpen(false);

    const freshCourses = loadCoursesFromStorage();
    setCourses(freshCourses);
    const validCourses = freshCourses.filter(c => c.finalGradePoint !== null && c.name.trim() !== "");
    const result = calculateSGPA(validCourses);

    if (!result) {
      toast(
        feature === "battle"
          ? "Calculate your grades first to start a battle! 📊"
          : "Calculate your grades first to get roasted! 🔥",
        { duration: 3000 }
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (feature === "battle") setBattleOpen(true);
    else setRoastOpen(true);
  };

  const extraFeaturesItems = [
    {
      label: "Grade Battle",
      emoji: "⚔️",
      description: "Challenge a friend to a grade showdown",
      onClick: () => checkGradesAndLaunch("battle"),
    },
    {
      label: "Roast Mode",
      emoji: "🔥",
      description: "Get an AI roast of your grades",
      onClick: () => checkGradesAndLaunch("roast"),
    },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-[hsl(240,15%,6%)] border-b border-[hsl(240,12%,14%)] overflow-x-hidden">
        <div ref={containerRef} className="container relative flex h-14 items-center justify-between md:justify-center gap-3 overflow-x-hidden">
          {/* Animated glow line — desktop only */}
          {!isMobile && activeIndex >= 0 && (
            <motion.div
              className="absolute top-0 h-[3px] rounded-b-full bg-white"
              style={{
                boxShadow:
                  "0 0 8px 2px rgba(255,255,255,0.7), 0 0 20px 6px rgba(255,255,255,0.4), 0 0 40px 12px rgba(255,255,255,0.15)",
              }}
              animate={{ left: indicator.left, width: indicator.width }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}

          <img src="/logo.png" alt="TeamDino logo" className="w-8 h-8 rounded-full" />

          {/* Desktop nav */}
          {!isMobile && navItems.map((item, i) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                ref={(el) => { navRefs.current[i] = el; }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-[hsl(220,10%,55%)] hover:text-[hsl(220,15%,80%)] hover:bg-[hsl(240,12%,12%)]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Extra Features dropdown hidden */}

          {!isMobile && externalLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 text-[hsl(220,10%,55%)] hover:text-[hsl(220,15%,80%)] hover:bg-[hsl(240,12%,12%)]"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </a>
          ))}

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-full text-[hsl(220,10%,55%)] hover:text-white hover:bg-[hsl(240,12%,12%)] transition-all duration-200"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </motion.div>
            </button>

            {isMobile && (
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
                className="p-2 rounded-full text-[hsl(220,10%,55%)] hover:text-white hover:bg-[hsl(240,12%,12%)] transition-all duration-200"
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
              className="overflow-hidden border-t border-[hsl(240,12%,14%)] bg-[hsl(240,15%,6%)]"
            >
              <div className="container flex flex-col py-2 gap-1">
                {navItems.map((item) => {
                  const isActive = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? "text-white bg-[hsl(240,12%,12%)]"
                          : "text-[hsl(220,10%,55%)] hover:text-white hover:bg-[hsl(240,12%,12%)]"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}

                {/* Mobile Extra Features expandable */}
                <button
                  onClick={() => setMobileExtraOpen(v => !v)}
                  className="inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 text-[hsl(220,10%,55%)] hover:text-white hover:bg-[hsl(240,12%,12%)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Extra Features</span>
                  <ChevronDown className={`w-3 h-3 ml-auto transition-transform duration-200 ${mobileExtraOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {mobileExtraOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 space-y-1 pb-1">
                        {extraFeaturesItems.map((item) => (
                          <button
                            key={item.label}
                            onClick={item.onClick}
                            className="w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-150 hover:bg-[hsl(240,12%,12%)]"
                          >
                            <span className="text-lg mt-0.5">{item.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">{item.label}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pop-pink/20 text-pop-pink leading-none">NEW</span>
                              </div>
                              <p className="text-xs text-[hsl(220,10%,50%)] mt-0.5">{item.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {externalLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 text-[hsl(220,10%,55%)] hover:text-white hover:bg-[hsl(240,12%,12%)]"
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

      <GradeBattleModal open={battleOpen} onOpenChange={setBattleOpen} courses={courses} />
      <RoastModeModal open={roastOpen} onOpenChange={setRoastOpen} courses={courses} />
    </>
  );
}
