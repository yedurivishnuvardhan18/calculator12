import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Calculator,
  CheckSquare,
  GraduationCap,
  MessageSquare,
  Moon,
  Sun,
  Search,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/")}>
            <Calculator className="mr-2 h-4 w-4" />
            Grade Calculator
          </CommandItem>
          <CommandItem onSelect={() => go("/habits")}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Habit Tracker
          </CommandItem>
          <CommandItem onSelect={() => go("/learn")}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Learn
          </CommandItem>
          <CommandItem onSelect={() => go("/external/feedback")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Feedback
          </CommandItem>
          <CommandItem onSelect={() => go("/gitam-results")}>
            <Search className="mr-2 h-4 w-4" />
            GITAM Results
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => { toggleTheme(); setOpen(false); }}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle {theme === "dark" ? "Light" : "Dark"} Mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
