import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Course, calculateSGPA } from "@/types/calculator";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface GradeBattleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
}

export function GradeBattleModal({ open, onOpenChange, courses }: GradeBattleModalProps) {
  const [friendName, setFriendName] = useState("");
  const [friendSGPA, setFriendSGPA] = useState("");
  const [battleStarted, setBattleStarted] = useState(false);

  const validCourses = courses.filter(c => c.finalGradePoint !== null && c.name.trim() !== "");
  const result = calculateSGPA(validCourses);
  const mySGPA = result?.sgpa ?? 0;
  const friendSGPANum = parseFloat(friendSGPA);
  const isValidFriend = !isNaN(friendSGPANum) && friendSGPANum >= 0 && friendSGPANum <= 10;

  const winner = mySGPA > friendSGPANum ? "you" : friendSGPANum > mySGPA ? "friend" : "tie";
  const diff = Math.abs(mySGPA - friendSGPANum).toFixed(2);

  const getMessage = () => {
    if (winner === "you") {
      if (parseFloat(diff) >= 2) return `🏆 Absolute domination! You crushed ${friendName || "your friend"} by ${diff} points!`;
      if (parseFloat(diff) >= 1) return `💪 Solid win! You beat ${friendName || "your friend"} by ${diff} points!`;
      return `😅 Close call! You edged out ${friendName || "your friend"} by ${diff} points!`;
    }
    if (winner === "friend") {
      if (parseFloat(diff) >= 2) return `😭 ${friendName || "Your friend"} destroyed you by ${diff} points. Time to study!`;
      if (parseFloat(diff) >= 1) return `😤 ${friendName || "Your friend"} won by ${diff}. You'll get them next time!`;
      return `😬 So close! ${friendName || "Your friend"} barely won by ${diff}. Almost had it!`;
    }
    return `🤝 It's a tie! You and ${friendName || "your friend"} are equally matched!`;
  };

  const handleShare = () => {
    const text = `⚔️ Grade Battle Result!\n\nMe: ${mySGPA.toFixed(2)} SGPA\n${friendName || "Friend"}: ${friendSGPANum.toFixed(2)} SGPA\n\n${getMessage()}\n\nBattle on GradeGuru by TeamDino 🎓`;
    if (navigator.share) {
      navigator.share({ title: "Grade Battle", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Battle result copied to clipboard!");
    }
  };

  const handleReset = () => {
    setBattleStarted(false);
    setFriendName("");
    setFriendSGPA("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) handleReset(); }}>
      <DialogContent className="sm:max-w-md rounded-3xl border-3 border-pop-pink/30 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Swords className="w-5 h-5 text-pop-pink" />
            Grade Battle ⚔️
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!battleStarted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-muted/50 rounded-2xl p-4 text-center border-2 border-foreground/5">
                <p className="text-xs text-muted-foreground mb-1">Your SGPA</p>
                <p className="text-3xl font-black font-display text-pop-green">{mySGPA.toFixed(2)}</p>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Friend's name (optional)"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  className="rounded-xl border-2"
                />
                <Input
                  type="number"
                  placeholder="Friend's SGPA (0-10)"
                  value={friendSGPA}
                  onChange={(e) => setFriendSGPA(e.target.value)}
                  min={0}
                  max={10}
                  step={0.01}
                  className="rounded-xl border-2"
                />
              </div>

              <Button
                onClick={() => setBattleStarted(true)}
                disabled={!isValidFriend}
                className="w-full rounded-full bg-pop-pink hover:bg-pop-pink/90 text-white font-bold font-display pop-shadow"
              >
                <Swords className="w-4 h-4 mr-2" />
                Start Battle!
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-1">You</p>
                  <p className={`text-3xl font-black font-display ${winner === "you" ? "text-pop-green" : "text-muted-foreground"}`}>
                    {mySGPA.toFixed(2)}
                  </p>
                  {winner === "you" && <Trophy className="w-5 h-5 text-pop-yellow mx-auto mt-1" />}
                </div>
                <div className="text-2xl font-bold text-muted-foreground">⚔️</div>
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{friendName || "Friend"}</p>
                  <p className={`text-3xl font-black font-display ${winner === "friend" ? "text-pop-green" : "text-muted-foreground"}`}>
                    {friendSGPANum.toFixed(2)}
                  </p>
                  {winner === "friend" && <Trophy className="w-5 h-5 text-pop-yellow mx-auto mt-1" />}
                </div>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 text-center border-2 border-foreground/5">
                <p className="text-sm font-medium">{getMessage()}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleShare} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs">
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  Share
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs">
                  Rematch
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
