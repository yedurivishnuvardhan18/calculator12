import { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
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

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState("");
  const [sending, setSending] = useState(false);

  const submit = () => {
    if (!report.trim()) return;
    setSending(true);
    console.log("[Bug Report]", report);
    setTimeout(() => {
      toast.success("Bug report submitted. Thank you!");
      setReport("");
      setSending(false);
      setOpen(false);
    }, 500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-warning transition-all"
        aria-label="Report a bug"
      >
        <AlertTriangle className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Report a Bug</DialogTitle>
            <DialogDescription>
              Describe what went wrong and we'll look into it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Describe the issue..."
            rows={4}
          />
          <DialogFooter>
            <Button onClick={submit} disabled={!report.trim() || sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
