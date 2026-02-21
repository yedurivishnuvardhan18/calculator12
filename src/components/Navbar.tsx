import { NavLink, useLocation } from "react-router-dom";
import { Calculator, CheckSquare, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const navItems = [
  { to: "/", label: "Grade Calculator", icon: Calculator, end: true },
  { to: "/habits", label: "Habit Tracker", icon: CheckSquare },
];

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const activeIndex = navItems.findIndex((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  useEffect(() => {
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
  }, [activeIndex]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[hsl(240,15%,6%)] border-b border-[hsl(240,12%,14%)]">
      <div ref={containerRef} className="container relative flex h-14 items-center justify-center gap-3">
        {/* Animated glow line */}
        {activeIndex >= 0 && (
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

        {navItems.map((item, i) => {
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

        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="ml-2 p-2 rounded-full text-[hsl(220,10%,55%)] hover:text-white hover:bg-[hsl(240,12%,12%)] transition-all duration-200"
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
      </div>
    </nav>
  );
}
