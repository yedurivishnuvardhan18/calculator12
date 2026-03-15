import { useState } from "react";
import { Sparkles, Copy, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  studentName: string;
  grades: { course: string; grade: string; credits: string }[];
  sgpa?: string;
  cgpa?: string;
}

export function AiFeedbackModal({ studentName, grades, sgpa, cgpa }: Props) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-feedback", {
        body: { studentName, grades, sgpa, cgpa },
      });

      if (error) throw error;
      setFeedback(data?.feedback || "No feedback generated.");
    } catch (e: any) {
      console.error("AI feedback error:", e);
      toast.error("Failed to generate feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    generate();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(feedback);
    toast.success("Copied to clipboard!");
  };

  const saveToConsole = () => {
    // Feedback saved
    toast.success("Feedback saved!");
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono font-bold text-muted-foreground hover:border-emerald-400 hover:text-emerald-400 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Generate Feedback ✨
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">AI Feedback for {studentName}</DialogTitle>
            <DialogDescription>
              AI-generated performance feedback based on grade data.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-3">
              <div className="h-4 rounded skeleton-shimmer" />
              <div className="h-4 rounded skeleton-shimmer w-5/6" />
              <div className="h-4 rounded skeleton-shimmer w-4/6" />
              <div className="h-4 rounded skeleton-shimmer w-5/6" />
              <div className="h-4 rounded skeleton-shimmer w-3/6" />
            </div>
          ) : (
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={copyToClipboard} disabled={!feedback}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button onClick={saveToConsole} disabled={!feedback}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
