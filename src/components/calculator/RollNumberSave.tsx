import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookmarkPlus, Search, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Course, createNewCourse } from "@/types/calculator";
import { toast } from "sonner";

interface RollNumberSaveProps {
  courses: Course[];
  showCGPA: boolean;
  cgpaData: {
    cgpa: number;
    previousCGPA: number;
    previousCredits: number;
    newTotalCredits: number;
  } | null;
  onLoad: (data: {
    courses: Course[];
    showCGPA: boolean;
    cgpaData: {
      cgpa: number;
      previousCGPA: number;
      previousCredits: number;
      newTotalCredits: number;
    } | null;
  }) => void;
}

export function RollNumberSave({ courses, showCGPA, cgpaData, onLoad }: RollNumberSaveProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"idle" | "save" | "load">("idle");

  const sanitizedRoll = rollNumber.trim().toUpperCase();
  const isValidRoll = /^[A-Z0-9]{5,20}$/.test(sanitizedRoll);

  const hasValidCourses = courses.some(
    (c) => c.finalGradePoint !== null && c.name.trim() !== ""
  );

  const handleSave = async () => {
    if (!isValidRoll || !hasValidCourses) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("saved_grade_cards")
        .upsert(
          {
            roll_number: sanitizedRoll,
            courses: JSON.parse(JSON.stringify(courses)),
            show_cgpa: showCGPA,
            cgpa_data: cgpaData ? JSON.parse(JSON.stringify(cgpaData)) : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "roll_number" }
        );

      if (error) throw error;
      toast.success(`Grade card saved for ${sanitizedRoll}! 🎉`);
      setMode("idle");
    } catch (err: any) {
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!isValidRoll) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_grade_cards")
        .select("*")
        .eq("roll_number", sanitizedRoll)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error(`No saved grade card found for ${sanitizedRoll}`);
        return;
      }

      onLoad({
        courses: data.courses as unknown as Course[],
        showCGPA: data.show_cgpa,
        cgpaData: data.cgpa_data as unknown as RollNumberSaveProps["cgpaData"],
      });
      toast.success(`Grade card loaded for ${sanitizedRoll}! 📋`);
      setMode("idle");
      setIsOpen(false);
    } catch {
      toast.error("Failed to load. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full border-2 border-pop-purple/40 font-bold font-display text-pop-purple hover:bg-pop-purple hover:text-white transition-all duration-300 text-xs sm:text-sm gap-1.5"
        >
          <BookmarkPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Save / Load</span>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 bg-card border-2 border-foreground/10 rounded-2xl p-4 pop-shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-display text-sm">Your Roll Number</h3>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 rounded-full"
                onClick={() => { setIsOpen(false); setMode("idle"); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Input
              placeholder="e.g., 2301234567"
              value={rollNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                if (val.length <= 20) setRollNumber(val);
              }}
              className="rounded-xl border-2 border-foreground/10 focus:border-pop-purple h-10 uppercase font-mono"
            />

            {!isValidRoll && rollNumber.length > 0 && (
              <p className="text-[10px] text-destructive font-medium">
                Enter a valid roll number (5-20 alphanumeric characters)
              </p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => { setMode("save"); handleSave(); }}
                disabled={!isValidRoll || !hasValidCourses || loading}
                size="sm"
                className="flex-1 rounded-xl bg-pop-green hover:bg-pop-green/90 text-white font-bold font-display text-xs transition-all"
              >
                {loading && mode === "save" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Check className="w-3.5 h-3.5 mr-1" />
                )}
                Save
              </Button>
              <Button
                onClick={() => { setMode("load"); handleLoad(); }}
                disabled={!isValidRoll || loading}
                size="sm"
                variant="outline"
                className="flex-1 rounded-xl border-2 border-pop-cyan font-bold font-display text-xs text-pop-cyan hover:bg-pop-cyan hover:text-white transition-all"
              >
                {loading && mode === "load" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Search className="w-3.5 h-3.5 mr-1" />
                )}
                Load
              </Button>
            </div>

            {!hasValidCourses && (
              <p className="text-[10px] text-muted-foreground font-medium text-center">
                Complete at least one course to save your grade card.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
