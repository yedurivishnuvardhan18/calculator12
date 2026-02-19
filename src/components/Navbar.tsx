import { NavLink } from "@/components/NavLink";
import { Calculator, CheckSquare, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-center gap-3">
        <img src="/logo.png" alt="TeamDino logo" className="w-8 h-8 rounded-full" />
        <NavLink
          to="/"
          end
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
          activeClassName="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground pop-shadow"
        >
          <Calculator className="w-4 h-4" />
          <span>Grade Calculator</span>
        </NavLink>
        <NavLink
          to="/habits"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
          activeClassName="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground pop-shadow"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Habit Tracker</span>
        </NavLink>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="ml-2 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
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
