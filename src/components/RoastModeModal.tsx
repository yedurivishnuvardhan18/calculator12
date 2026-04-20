import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Course, calculateSGPA } from "@/types/calculator";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Copy, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface RoastModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
}

// Telugu roasts written in English (Tenglish) - fallbacks
const teluguFallbacks = {
  high: [ // SGPA >= 9
    "Enti ra nee SGPA chusi calculator kuda shock ayyindi! 😱 Nuvvu chaduvutunnav ante books kuda bhayapadtunnay. Touch some grass ra babu! 🌿💀",
    "O grades aa? Nee social life eppudu chachipoyindho cheppu. 📚 Ammayilaki/Abbaayilaki nee number kanna nee SGPA ekkuva famous! 😤",
    "Enti ra topper! Nee dark circles chusi panda ani confuse ayyaru. 🐼 Chaduvutho paatu koddiga sunlight lo kuda nillchu ra! ☀️💀",
    "Nee grades chusi mee amma WhatsApp status pettesindi. 📱 Relatives andaru 'maa pilladu/pilla' ani cheppukuntunnaru. Pressure handle cheyyi ra! 🏆😅",
    "Brathuku lo anni O grades a? Inka nee life lo 'O my god' moment raaledhu anthe! 🤣 Chill avvu masteru, toppers ki kuda rest kavali! 😴",
  ],
  good: [ // SGPA 7-9
    `Nee SGPA chusi... hmm... 'try chesav, kaani saripoledu' category lo padtav ra! 📊😬 Konchum ekkuva effort pettalsindi.`,
    "Enti ra ee grades? Na mummy kuda 'average' ani cheppedi, nee grades laga! 🤣 B+ energy — room temperature water lanti performance! 🥤",
    "Nee SGPA decent eh kaani, 'amma ki cheppukodam' range lo ledu ra. 😅 Oka 2 marks ekkuva osthe baagundu kadha! 📉",
    "Chaduvutunnav kaani, chaduvuthunnattuga ledu ra! 📖 Nee grades WhatsApp group lo share cheyyagalava? Adhe nee answer! 😬💀",
    "Nee performance 'Paisa vasool' movie laga... interval dhaaka baane untundi, climax lo disappoint chestav! 🎬😤",
  ],
  mid: [ // SGPA 5-7
    "Nee SGPA chusi WiFi signal anukunna — barely connecting! 📶😭 Inka koddiga padthe disconnect ayipothav ra!",
    "Enti ra ee grades? Nee attendance kanna nee SGPA takkuva undemo! 🏫💀 Auto lo velthe auto driver kuda judge chestadu!",
    "Nee results chusi mee nanna 'naaku pillalu levu' ani cheppadu relatives ki! 😤 Brathuku ra... kaani first chaduvuko! 📚",
    "Nee grades life support lo unnay ra! 🏥 ICU lo admit cheyyaniki oka mark takkuva. Study cheyyi leda hospital bed book cheyyi! 💀",
    "Emi ra nee performance? Exam hall lo kurchunte AC kuda off chestharu — 'cool' ga emi ledu ani! ❄️🤣",
  ],
  low: [ // SGPA < 5
    "Nee SGPA ki CPR kaadu, directly last rites kavali ra! 🙏💀 Calculator nee grades chusi format ayyindi!",
    "Enti ra ee grades?! Nee marksheet chusi paper waste vaadu kuda reject chesadu! 📄🗑️ Inka em chaduvuthav ra!",
    "Nee SGPA chusi college principal 'refund ivvandi' annaadu fees! 💰😭 History lo worst performance award nee pere! 🏆💀",
    "Emi ra nee grades? Shredder lo veste shredder kuda 'idi already waste paper' ani reject chesindi! 📄💀 Inka hope undha?!",
    "Nee results chusi Google Maps kuda 'wrong direction' ani cheppindi! 🗺️ U-turn kottu ra life lo! 🔄😤",
  ],
};

function getTeluguFallback(sgpa: number): string {
  const pool =
    sgpa >= 9 ? teluguFallbacks.high :
    sgpa >= 7 ? teluguFallbacks.good :
    sgpa >= 5 ? teluguFallbacks.mid :
    teluguFallbacks.low;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getSgpaReaction(sgpa: number): { emoji: string; label: string; color: string } {
  if (sgpa >= 9) return { emoji: "👑", label: "Topper Maawa!", color: "text-pop-yellow" };
  if (sgpa >= 8) return { emoji: "💪", label: "Bagundi Kaani...", color: "text-pop-green" };
  if (sgpa >= 7) return { emoji: "😬", label: "Sare Le...", color: "text-pop-cyan" };
  if (sgpa >= 5) return { emoji: "😰", label: "Enti Ra Idi?!", color: "text-pop-orange" };
  return { emoji: "💀", label: "RIP Grades", color: "text-destructive" };
}

export function RoastModeModal({ open, onOpenChange, courses }: RoastModeModalProps) {
  const [roast, setRoast] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const validCourses = courses.filter(c => c.finalGradePoint !== null && c.name.trim() !== "");
  const result = calculateSGPA(validCourses);
  const reaction = result ? getSgpaReaction(result.sgpa) : null;

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
          mode: "roast-telugu"
        },
      });

      if (error) throw error;
      setRoast(data?.feedback || getTeluguFallback(result.sgpa));
      setGenerated(true);
    } catch {
      setRoast(getTeluguFallback(result.sgpa));
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roast);
    toast.success("Roast copied ra! 🔥");
  };

  const handleShare = () => {
    const text = `🔥 Grade Roast!\n\nSGPA: ${result?.sgpa.toFixed(2)}\n\n${roast}\n\n— Roasted by GradeGuru 💀`;
    if (navigator.share) {
      navigator.share({ title: "Grade Roast 🔥", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Roast copied to clipboard!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRoast(""); setGenerated(false); } }}>
      <DialogContent className="sm:max-w-md rounded-3xl border-3 border-pop-orange/30 bg-card overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Flame className="w-5 h-5 text-pop-orange" />
            Roast Mode 🔥
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pop-pink/20 text-pop-pink ml-auto">TELUGU</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {result && reaction && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-pop-orange/10 rounded-2xl p-5 text-center border-2 border-pop-orange/20"
            >
              <motion.span
                className="text-4xl block mb-2"
                animate={{ rotate: [0, -10, 10, -5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {reaction.emoji}
              </motion.span>
              <p className="text-4xl font-black font-display text-pop-green">{result.sgpa.toFixed(2)}</p>
              <p className={`text-sm font-bold font-display mt-1 ${reaction.color}`}>{reaction.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{validCourses.length} courses</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 py-2">
                <Skeleton className="h-4 w-full skeleton-shimmer" />
                <Skeleton className="h-4 w-4/5 skeleton-shimmer" />
                <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
                <Skeleton className="h-4 w-5/6 skeleton-shimmer" />
                <p className="text-xs text-muted-foreground text-center mt-3 font-medium">
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Roast prepare avthundi... 🍳🔥
                  </motion.span>
                </p>
              </motion.div>
            ) : generated ? (
              <motion.div key="result" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <motion.div
                  className="bg-pop-orange/10 rounded-2xl p-4 border-2 border-pop-orange/20 relative overflow-hidden"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute top-2 right-2 text-2xl opacity-20">🔥</div>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{roast}</p>
                </motion.div>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs h-10">
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                  <Button onClick={handleShare} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs h-10">
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Share
                  </Button>
                  <Button onClick={generateRoast} variant="outline" className="flex-1 rounded-full border-2 font-bold text-xs h-10">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Again
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="start" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={generateRoast}
                  className="w-full rounded-full bg-pop-orange hover:bg-pop-orange/90 text-white font-bold font-display pop-shadow h-12 text-base"
                >
                  <Flame className="w-5 h-5 mr-2" />
                  Roast My Grades Ra! 🔥
                </Button>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  ⚠️ Warning: Emotional damage guarantee! Telugu lo savage roast vastundi 💀
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
