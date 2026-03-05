import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Course, calculateSGPA } from "@/types/calculator";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface RoastModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
}

export function RoastModeModal({ open, onOpenChange, courses }: RoastModeModalProps) {
  const [roast, setRoast] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const validCourses = courses.filter(c => c.finalGradePoint !== null && c.name.trim() !== "");
  const result = calculateSGPA(validCourses);

  const generateRoast = async () => {
    if (!result) return;
    setLoading(true);
    setGenerated(false);

    const gradesSummary = validCourses.map(c =>
      `${c.name}: ${c.letterGrade} (${c.finalGradePoint}/10)`
    ).join(", ");

    try {
      const { data, error } = await supabase.functions.invoke("ai-feedback", {
        body: {
          studentName: "Student",
          grades: gradesSummary,
          sgpa: result.sgpa.toFixed(2),
          mode: "roast"
        },
      });

      if (error) throw error;
      setRoast(data?.feedback || "Couldn't come up with a roast. Your grades are that forgettable. 💀");
      setGenerated(true);
    } catch {
      // Fallback roasts based on SGPA
      const sgpa = result.sgpa;
      const fallbacks = sgpa >= 9
        ? [
            "Your SGPA is so high, even your calculator is intimidated. Touch grass sometime! 🌿",
            "Straight O grades? We get it, you don't have a social life. 📚💀",
            "Your grades are perfect but your dark circles tell a different story. 😴",
          ]
        : sgpa >= 7
        ? [
            `${sgpa.toFixed(2)} SGPA? Not bad, not great. The 'participation trophy' of academics. 🏆`,
            "Your grades say 'I studied' but your SGPA says 'not hard enough'. 📖😬",
            "Solid B+ energy. The academic equivalent of 'room temperature water'. 🥤",
          ]
        : sgpa >= 5
        ? [
            "Your SGPA is like your WiFi signal — barely connecting. 📶",
            `${sgpa.toFixed(2)}? Your grades are on life support. Send help! 🏥`,
            "At this rate, your degree will arrive via snail mail... in 2030. 🐌",
          ]
        : [
            "Your SGPA needs CPR. Actually, it needs a miracle. 🙏💀",
            "I've seen better grades on a report card that went through a shredder. 📄",
            `${sgpa.toFixed(2)}?! The calculator crashed trying to process this tragedy. 💥`,
          ];
      setRoast(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roast);
    toast.success("Roast copied! 🔥");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRoast(""); setGenerated(false); } }}>
      <DialogContent className="sm:max-w-md rounded-3xl border-3 border-pop-orange/30 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Flame className="w-5 h-5 text-pop-orange" />
            Roast Mode 🔥
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {result && (
            <div className="bg-muted/50 rounded-2xl p-4 text-center border-2 border-foreground/5">
              <p className="text-xs text-muted-foreground mb-1">Your SGPA</p>
              <p className="text-3xl font-black font-display text-pop-green">{result.sgpa.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{validCourses.length} courses</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                <Skeleton className="h-4 w-full skeleton-shimmer" />
                <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
                <Skeleton className="h-4 w-5/6 skeleton-shimmer" />
                <p className="text-xs text-muted-foreground text-center mt-2">Cooking up a roast... 🍳</p>
              </motion.div>
            ) : generated ? (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="bg-pop-orange/10 rounded-2xl p-4 border-2 border-pop-orange/20">
                  <p className="text-sm font-medium leading-relaxed">{roast}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs">
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>
                  <Button onClick={generateRoast} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs">
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Roast Again
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={generateRoast}
                  className="w-full rounded-full bg-pop-orange hover:bg-pop-orange/90 text-white font-bold font-display pop-shadow"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Roast My Grades! 🔥
                </Button>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Warning: May cause emotional damage 💀
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
