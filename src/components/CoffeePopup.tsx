import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coffee, X } from "lucide-react";
import coffeeCup from "@/assets/coffee-cup.png";

const SESSION_KEY = "ht_coffee_popup_seen";
const POPUP_DELAY = 3000; // 3 seconds after page load

export function CoffeePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, POPUP_DELAY);

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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2">
            <img
              src={coffeeCup}
              alt="Coffee cup"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <DialogTitle className="text-xl font-bold">
            Enjoying TeamDino? ☕
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            If this tool has been helpful, consider buying us a coffee! Your support keeps us building free tools for students.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleDonate} className="w-full gap-2">
            <Coffee className="w-4 h-4" />
            Buy Me a Coffee
          </Button>
          <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
