import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coffee, Clock } from "lucide-react";
import coffeeCup from "@/assets/coffee-cup.png";

const SESSION_KEY = "ht_coffee_popup_seen";
const REMIND_KEY = "ht_coffee_remind_at";
const POPUP_DELAY = 3000;

export function CoffeePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen) return;

    // Check if user asked to be reminded later
    const remindAt = localStorage.getItem(REMIND_KEY);
    if (remindAt) {
      const remaining = Number(remindAt) - Date.now();
      if (remaining > 0) {
        const timer = setTimeout(() => {
          localStorage.removeItem(REMIND_KEY);
          setOpen(true);
        }, remaining);
        return () => clearTimeout(timer);
      }
      localStorage.removeItem(REMIND_KEY);
    }

    const timer = setTimeout(() => setOpen(true), POPUP_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  const handleDonate = () => {
    window.open("https://razorpay.me/@teamdino", "_blank", "noopener,noreferrer");
    handleClose();
  };

  const handleRemind = () => {
    localStorage.setItem(REMIND_KEY, String(Date.now() + 5 * 60 * 1000));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2">
            <img src={coffeeCup} alt="Coffee cup" className="w-20 h-20 object-contain drop-shadow-lg" />
          </div>
          <DialogTitle className="text-xl font-bold">Enjoying TeamDino? ☕</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            If this tool has been helpful, consider buying us a coffee! Your support keeps us building free tools for students.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleDonate} className="w-full gap-2">
            <Coffee className="w-4 h-4" />
            Buy Me a Coffee
          </Button>
          <Button variant="outline" onClick={handleRemind} className="w-full gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            Remind Me in 5 Minutes
          </Button>
          <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
