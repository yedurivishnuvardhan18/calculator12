import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Course, calculateSGPA } from "@/types/calculator";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Trophy, Share2, RotateCcw, Zap, Shield, Target } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface GradeBattleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
}

const battleMessages = {
  you: {
    crush: [
      "🏆 FLAWLESS VICTORY! You absolutely demolished {friend} by {diff} points! They need to go back to school... oh wait.",
      "💀 {friend} didn't stand a chance! {diff} points gap — that's not a battle, that's a massacre!",
      "👑 ALL HAIL THE GRADE KING/QUEEN! {friend} was defeated by {diff} points. Bow down!",
    ],
    solid: [
      "💪 Clean W! You took down {friend} by {diff} points. Hard work pays off!",
      "🔥 Dominant performance! {diff} points ahead of {friend}. Keep that energy!",
      "⚡ {friend} fought hard but you came out on top by {diff}. GG!",
    ],
    close: [
      "😅 Photo finish! You barely scraped past {friend} by {diff}. That was TOO close!",
      "🫣 Squeaked by with a {diff} point lead over {friend}. Heart was RACING!",
      "😮‍💨 {diff} points... you survived by the skin of your teeth against {friend}!",
    ],
  },
  friend: {
    crush: [
      "💀 {friend} didn't just win — they DESTROYED you by {diff} points. Time for a training arc!",
      "😭 {diff} points behind {friend}?! That's not a loss, that's a life lesson.",
      "📉 {friend} said 'levels to this' and proved it with a {diff} point gap. Ouch.",
    ],
    solid: [
      "😤 {friend} took this one by {diff}. Revenge arc loading...",
      "😬 Down by {diff} to {friend}. Not ideal, but you'll bounce back!",
      "🥲 {friend} won fair and square by {diff}. Respect... but also pain.",
    ],
    close: [
      "😩 SO CLOSE! {friend} edged you out by just {diff}. That's painful!",
      "💔 Lost by {diff} to {friend}. One more good assignment and it could've been yours!",
      "😤 {diff} points. JUST {diff}. {friend} got lucky this time!",
    ],
  },
  tie: [
    "🤝 PERFECTLY BALANCED! You and {friend} are academic twins! Same brain?",
    "⚖️ A tie?! You and {friend} share one brain cell and it's working overtime!",
    "🪞 Mirror match! You and {friend} are literally the same person academically.",
  ],
};

function getBattleMessage(winner: string, diff: number, friendName: string): string {
  const name = friendName || "your friend";
  let pool: string[];

  if (winner === "tie") {
    pool = battleMessages.tie;
  } else {
    const side = winner === "you" ? battleMessages.you : battleMessages.friend;
    pool = diff >= 2 ? side.crush : diff >= 1 ? side.solid : side.close;
  }

  const msg = pool[Math.floor(Math.random() * pool.length)];
  return msg.replace(/\{friend\}/g, name).replace(/\{diff\}/g, diff.toFixed(2));
}

function getPerformanceLevel(sgpa: number): { label: string; color: string; icon: typeof Zap } {
  if (sgpa >= 9) return { label: "Legend", color: "text-pop-yellow", icon: Trophy };
  if (sgpa >= 8) return { label: "Strong", color: "text-pop-green", icon: Zap };
  if (sgpa >= 7) return { label: "Decent", color: "text-pop-cyan", icon: Shield };
  return { label: "Rookie", color: "text-pop-orange", icon: Target };
}

export function GradeBattleModal({ open, onOpenChange, courses }: GradeBattleModalProps) {
  const [friendName, setFriendName] = useState("");
  const [friendSGPA, setFriendSGPA] = useState("");
  const [battleStarted, setBattleStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const hasConfettied = useRef(false);

  const validCourses = courses.filter(c => c.finalGradePoint !== null && c.name.trim() !== "");
  const result = calculateSGPA(validCourses);
  const mySGPA = result?.sgpa ?? 0;
  const friendSGPANum = parseFloat(friendSGPA);
  const isValidFriend = !isNaN(friendSGPANum) && friendSGPANum >= 0 && friendSGPANum <= 10;

  const winner = mySGPA > friendSGPANum ? "you" : friendSGPANum > mySGPA ? "friend" : "tie";
  const diff = Math.abs(mySGPA - friendSGPANum);

  const myLevel = getPerformanceLevel(mySGPA);
  const friendLevel = getPerformanceLevel(friendSGPANum);

  // Countdown + reveal animation
  useEffect(() => {
    if (!battleStarted) return;
    hasConfettied.current = false;
    setShowResult(false);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => setShowResult(true), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [battleStarted]);

  // Confetti on win
  useEffect(() => {
    if (!showResult || hasConfettied.current) return;
    hasConfettied.current = true;
    if (winner === "you") {
      const colors = ['#FF6B9D', '#FFE66D', '#4ECDC4', '#A855F7'];
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors });
      setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors });
        confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors });
      }, 250);
    }
  }, [showResult, winner]);

  const handleShare = () => {
    const msg = getBattleMessage(winner, diff, friendName);
    const text = `⚔️ Grade Battle Result!\n\nMe: ${mySGPA.toFixed(2)} SGPA (${myLevel.label})\n${friendName || "Friend"}: ${friendSGPANum.toFixed(2)} SGPA (${friendLevel.label})\n\n${msg}\n\nBattle on GradeGuru by TeamDino 🎓`;
    if (navigator.share) {
      navigator.share({ title: "Grade Battle", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Battle result copied to clipboard!");
    }
  };

  const handleReset = () => {
    setBattleStarted(false);
    setShowResult(false);
    setFriendName("");
    setFriendSGPA("");
    setCountdown(3);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) handleReset(); }}>
      <DialogContent className="sm:max-w-md rounded-3xl border-3 border-pop-pink/30 bg-card overflow-hidden">
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
              <div className="bg-gradient-to-br from-pop-green/10 to-pop-cyan/10 rounded-2xl p-5 text-center border-2 border-pop-green/20">
                <p className="text-xs text-muted-foreground mb-1">Your Power Level</p>
                <p className="text-4xl font-black font-display text-pop-green">{mySGPA.toFixed(2)}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <myLevel.icon className={`w-4 h-4 ${myLevel.color}`} />
                  <span className={`text-xs font-bold ${myLevel.color}`}>{myLevel.label}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Opponent's name"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  className="rounded-xl border-2 h-11"
                />
                <Input
                  type="number"
                  placeholder="Opponent's SGPA (0-10)"
                  value={friendSGPA}
                  onChange={(e) => setFriendSGPA(e.target.value)}
                  min={0}
                  max={10}
                  step={0.01}
                  className="rounded-xl border-2 h-11"
                />
              </div>

              <Button
                onClick={() => setBattleStarted(true)}
                disabled={!isValidFriend}
                className="w-full rounded-full bg-pop-pink hover:bg-pop-pink/90 text-white font-bold font-display pop-shadow h-12 text-base"
              >
                <Swords className="w-5 h-5 mr-2" />
                Start Battle!
              </Button>
            </motion.div>
          ) : !showResult ? (
            <motion.div
              key="countdown"
              className="py-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-center gap-6 mb-6">
                <motion.div
                  className="text-center"
                  animate={{ x: [-20, 0], opacity: [0, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-2xl font-black font-display text-pop-green">{mySGPA.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">You</p>
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="text-3xl"
                >
                  ⚔️
                </motion.div>
                <motion.div
                  className="text-center"
                  animate={{ x: [20, 0], opacity: [0, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-2xl font-black font-display text-pop-pink">{friendSGPANum.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{friendName || "Friend"}</p>
                </motion.div>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl font-black font-display text-pop-yellow"
                >
                  {countdown > 0 ? countdown : "FIGHT!"}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="space-y-4"
            >
              {/* VS Display */}
              <div className="flex items-stretch justify-center gap-3">
                <motion.div
                  className={`flex-1 rounded-2xl p-4 text-center border-2 transition-all ${
                    winner === "you"
                      ? "border-pop-green/40 bg-pop-green/10"
                      : "border-foreground/5 bg-muted/30"
                  }`}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium">You</p>
                  <p className={`text-3xl font-black font-display ${winner === "you" ? "text-pop-green" : "text-muted-foreground"}`}>
                    {mySGPA.toFixed(2)}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <myLevel.icon className={`w-3 h-3 ${myLevel.color}`} />
                    <span className={`text-[10px] font-bold ${myLevel.color}`}>{myLevel.label}</span>
                  </div>
                  {winner === "you" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <Trophy className="w-6 h-6 text-pop-yellow mx-auto mt-2" />
                    </motion.div>
                  )}
                </motion.div>

                <div className="flex items-center">
                  <motion.span
                    className="text-xl font-black text-muted-foreground"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: 2 }}
                  >
                    VS
                  </motion.span>
                </div>

                <motion.div
                  className={`flex-1 rounded-2xl p-4 text-center border-2 transition-all ${
                    winner === "friend"
                      ? "border-pop-pink/40 bg-pop-pink/10"
                      : "border-foreground/5 bg-muted/30"
                  }`}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium">{friendName || "Friend"}</p>
                  <p className={`text-3xl font-black font-display ${winner === "friend" ? "text-pop-pink" : "text-muted-foreground"}`}>
                    {friendSGPANum.toFixed(2)}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <friendLevel.icon className={`w-3 h-3 ${friendLevel.color}`} />
                    <span className={`text-[10px] font-bold ${friendLevel.color}`}>{friendLevel.label}</span>
                  </div>
                  {winner === "friend" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <Trophy className="w-6 h-6 text-pop-yellow mx-auto mt-2" />
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Diff bar */}
              {winner !== "tie" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-muted/30 rounded-xl p-3 border border-foreground/5"
                >
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium">
                    <span>Gap</span>
                    <span className="font-bold text-foreground">{diff.toFixed(2)} points</span>
                  </div>
                  <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${winner === "you" ? "bg-pop-green" : "bg-pop-pink"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (diff / 10) * 100)}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`rounded-2xl p-4 text-center border-2 ${
                  winner === "you"
                    ? "bg-pop-green/10 border-pop-green/20"
                    : winner === "friend"
                    ? "bg-pop-pink/10 border-pop-pink/20"
                    : "bg-pop-yellow/10 border-pop-yellow/20"
                }`}
              >
                <p className="text-sm font-medium leading-relaxed">{getBattleMessage(winner, diff, friendName)}</p>
              </motion.div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleShare} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs h-10">
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Share
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs h-10">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
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
