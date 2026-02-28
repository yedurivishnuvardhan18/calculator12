import { NavLink, useLocation } from "react-router-dom";
import { Calculator, CheckSquare, Sun, Moon, Menu, X, Globe, MessageSquare, Coffee, GraduationCap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { to: "/", label: "Grade Calculator", icon: Calculator, end: true },
  { to: "/habits", label: "Habit Tracker", icon: CheckSquare },
  { to: "/external/feedback", label: "Feedback", icon: MessageSquare },
];

const externalLinks = [
  { href: "https://teamdino.in", label: "TeamDino", icon: Globe },
  { href: "https://razorpay.me/@teamdino", label: "Buy Me a Coffee", icon: Coffee },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  const activeIndex = navItems.findIndex((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  // Close menu on route change
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

  return (
    <nav className="sticky top-0 z-50 w-full bg-[hsl(240,15%,6%)] border-b border-[hsl(240,12%,14%)]">
      <div ref={containerRef} className="container relative flex h-14 items-center justify-between md:justify-center gap-3">
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

          {/* Hamburger — mobile only */}
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
  );
}