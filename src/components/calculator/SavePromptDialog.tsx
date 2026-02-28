import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, TrendingUp, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Course } from "@/types/calculator";
import { normalizeRoll, isValidRoll, saveGradeCard } from "@/lib/grade-card-storage";

interface SavePromptDialogProps {
  open: boolean;
  onClose: () => void;
  type: "sgpa" | "cgpa";
  courses: Course[];
  showCGPA: boolean;
  cgpaData?: {
    cgpa: number;
    previousCGPA: number;
    previousCredits: number;
    newTotalCredits: number;
  } | null;
  onShowCGPA?: () => void;
}

export function SavePromptDialog({ open, onClose, type, courses, showCGPA, cgpaData, onShowCGPA }: SavePromptDialogProps) {
  const [showRollInput, setShowRollInput] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const sanitized = normalizeRoll(rollNumber);
  const valid = isValidRoll(sanitized);

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    const result = await saveGradeCard(sanitized, {
      courses,
      showCGPA,
      cgpaData: cgpaData ?? null,
    });
    setSaving(false);

    if (result.ok) {
      toast.success("Grade card saved successfully! 🎉");
      handleClose();
    } else if (result.localFallback) {
      toast.warning("Saved locally on this device. Cloud save failed — retry when online.", { duration: 6000 });
      handleClose();
    } else {
      toast.error(result.error ?? "Failed to save.");
    }
  };

  const handleClose = () => {
    setShowRollInput(false);
    setRollNumber("");
    onClose();
  };

  const handleCalculateCGPA = () => {
    handleClose();
    onShowCGPA?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="rounded-3xl border-3 border-pop-pink/30 pop-shadow-lg max-w-sm mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display font-bold text-lg">
            {type === "sgpa" ? "🎉 SGPA Calculated!" : "🎉 CGPA Calculated!"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            What would you like to do next?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {!showRollInput ? (
            <>
              <Button
                onClick={() => setShowRollInput(true)}
                className="w-full rounded-full bg-pop-green hover:bg-pop-green/90 text-white font-bold font-display transition-all hover:scale-[1.02] active:scale-95"
              >
                <Save className="w-4 h-4 mr-2" />
                Save via Roll Number
              </Button>

              {type === "sgpa" && (
                <Button
                  onClick={handleCalculateCGPA}
                  variant="outline"
                  className="w-full rounded-full border-2 border-pop-orange text-pop-orange hover:bg-pop-orange hover:text-white font-bold font-display transition-all hover:scale-[1.02] active:scale-95"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Calculate CGPA
                </Button>
              )}

              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full rounded-full text-muted-foreground font-bold font-display hover:text-foreground"
              >
                <Clock className="w-4 h-4 mr-2" />
                Maybe Later
              </Button>
            </>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <Input
                placeholder="Enter Roll Number (e.g., 2201234)"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                className="rounded-2xl border-2 border-foreground/10 focus:border-pop-green h-12 text-center font-bold font-display tracking-wider"
                maxLength={20}
              />
              {rollNumber && !valid && (
                <p className="text-xs text-destructive text-center">5-20 alphanumeric characters required</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowRollInput(false)}
                  variant="outline"
                  className="flex-1 rounded-full font-bold font-display"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!valid || saving}
                  className="flex-1 rounded-full bg-pop-green hover:bg-pop-green/90 text-white font-bold font-display disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
