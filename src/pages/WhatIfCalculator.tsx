import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Target, Save, Share2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

const STORAGE_KEY = "whatif_calculator_state";

interface FutureSemester {
  credits: number;
  sgpa: number;
  semNumber: number;
}

interface SavedState {
  currentCGPA: number;
  completedCredits: number;
  futureSemesters: FutureSemester[];
  futureCount: number;
  gradingScale: number;
  currentSemester: number;
}

function getCGPATier(cgpa: number, scale: number) {
  const ratio = cgpa / scale;
  if (ratio >= 0.9) return { label: "Outstanding", emoji: "🏆", color: "text-yellow-400", bg: "bg-yellow-400/20", barColor: "bg-yellow-400" };
  if (ratio >= 0.8) return { label: "Distinction", emoji: "🥇", color: "text-green-400", bg: "bg-green-400/20", barColor: "bg-green-400" };
  if (ratio >= 0.7) return { label: "Good", emoji: "🥈", color: "text-blue-400", bg: "bg-blue-400/20", barColor: "bg-blue-400" };
  if (ratio >= 0.6) return { label: "Average", emoji: "🥉", color: "text-yellow-500", bg: "bg-yellow-500/20", barColor: "bg-yellow-500" };
  return { label: "Needs Improvement", emoji: "🔴", color: "text-red-400", bg: "bg-red-400/20", barColor: "bg-red-400" };
}

function getMilestoneMessage(cgpa: number, scale: number): string | null {
  const thresholds = [
    { value: scale * 0.9, label: "Outstanding" },
    { value: scale * 0.8, label: "Distinction" },
    { value: scale * 0.7, label: "Good Standing" },
  ];
  for (const t of thresholds) {
    const diff = t.value - cgpa;
    if (diff > 0 && diff <= scale * 0.05) {
      return `You are just ${diff.toFixed(2)} away from ${t.label}! 🎯`;
    }
  }
  return null;
}

function calcCGPA(currentCGPA: number, completedCredits: number, semesters: FutureSemester[]): number | null {
  const totalCompletedPoints = currentCGPA * completedCredits;
  const futurePoints = semesters.reduce((sum, s) => sum + s.sgpa * s.credits, 0);
  const futureCredits = semesters.reduce((sum, s) => sum + s.credits, 0);
  const totalCredits = completedCredits + futureCredits;
  if (totalCredits === 0) return null;
  const result = (totalCompletedPoints + futurePoints) / totalCredits;
  return Number.isFinite(result) ? result : null;
}

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    // Validate all fields
    const cs = Number(parsed.currentSemester);
    const cg = Number(parsed.currentCGPA);
    const cc = Number(parsed.completedCredits);
    const gs = Number(parsed.gradingScale);
    const fc = Number(parsed.futureCount);
    if (!Number.isFinite(cs) || !Number.isFinite(cg) || !Number.isFinite(cc)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      currentCGPA: Math.min(gs || 10, Math.max(0, cg)),
      completedCredits: Math.max(0, Math.floor(cc)),
      futureSemesters: Array.isArray(parsed.futureSemesters)
        ? parsed.futureSemesters.map((s: any) => ({
            credits: Math.max(1, Math.floor(Number(s?.credits) || 20)),
            sgpa: Math.min(gs || 10, Math.max(0, Number(s?.sgpa) || 0)),
            semNumber: Math.max(1, Math.floor(Number(s?.semNumber) || 1)),
          }))
        : [],
      futureCount: Math.max(1, Math.floor(fc || 1)),
      gradingScale: gs === 4 ? 4 : 10,
      currentSemester: Math.min(8, Math.max(1, Math.floor(cs))),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export default function WhatIfCalculator() {
  const [gradingScale, setGradingScale] = useState(10);
  const [currentCGPA, setCurrentCGPA] = useState(0);
  const [completedCredits, setCompletedCredits] = useState(0);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [futureCount, setFutureCount] = useState(1);
  const [futureSemesters, setFutureSemesters] = useState<FutureSemester[]>([{ credits: 20, sgpa: 7.0, semNumber: 2 }]);
  const [targetCGPA, setTargetCGPA] = useState(8.0);
  

  const maxFutureSemesters = 8 - currentSemester;

  // Load saved state
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setCurrentCGPA(saved.currentCGPA);
      setCompletedCredits(saved.completedCredits);
      setFutureSemesters(saved.futureSemesters);
      setFutureCount(saved.futureCount);
      if (saved.gradingScale) setGradingScale(saved.gradingScale);
      if (saved.currentSemester) setCurrentSemester(saved.currentSemester);
      toast.success("Welcome back! Your last session is loaded ✅");
    }
  }, []);

  // Clamp futureCount when currentSemester changes
  useEffect(() => {
    const max = 8 - currentSemester;
    if (futureCount > max) setFutureCount(Math.max(1, max));
  }, [currentSemester]);

  // Sync future semesters count and auto-label semester numbers
  useEffect(() => {
    setFutureSemesters(prev => {
      const updated = prev.length === futureCount ? [...prev]
        : prev.length < futureCount
          ? [...prev, ...Array.from({ length: futureCount - prev.length }, () => ({ credits: 20, sgpa: 7.0, semNumber: 1 }))]
          : prev.slice(0, futureCount);
      // Auto-assign semester numbers based on currentSemester
      return updated.map((s, i) => ({ ...s, semNumber: currentSemester + i + 1 }));
    });
  }, [futureCount, currentSemester]);

  const updateFutureSem = useCallback((index: number, field: keyof FutureSemester, value: number) => {
    setFutureSemesters(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }, []);

  const projectedCGPA = useMemo(() => calcCGPA(currentCGPA, completedCredits, futureSemesters), [currentCGPA, completedCredits, futureSemesters]);
  
  const tier = projectedCGPA !== null ? getCGPATier(projectedCGPA, gradingScale) : null;
  const milestone = projectedCGPA !== null ? getMilestoneMessage(projectedCGPA, gradingScale) : null;
  const delta = projectedCGPA !== null ? projectedCGPA - currentCGPA : null;

  // Reverse calculator
  const requiredSGPA = useMemo(() => {
    const futureCredits = futureSemesters.reduce((s, f) => s + f.credits, 0);
    if (futureCredits === 0) return null;
    const needed = (targetCGPA * (completedCredits + futureCredits) - currentCGPA * completedCredits) / futureCredits;
    return needed;
  }, [targetCGPA, currentCGPA, completedCredits, futureSemesters]);

  const handleSave = () => {
    const state: SavedState = { currentCGPA, completedCredits, futureSemesters, futureCount, gradingScale, currentSemester };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    toast.success("Saved! Your data will be here next time 💾");
  };

  const handleShare = () => {
    const sgpaText = futureSemesters.map((s, i) => `Sem ${i + 1}: ${s.sgpa}`).join(", ");
    const text = `What-If I score ${sgpaText}? My CGPA will be ${projectedCGPA?.toFixed(2)}! 🎓 Try it at gradegurubyteamdino.vercel.app/what-if`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const progressPercent = projectedCGPA !== null ? (projectedCGPA / gradingScale) * 100 : 0;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-[var(--font-display)] text-foreground flex items-center justify-center gap-3">
          <Target className="w-8 h-8 text-primary" />
          What-If CGPA Predictor
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">Enter your current standing and simulate future semesters</p>
      </motion.div>

      {/* Section 1: Current Standing */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">📚 Your Current Standing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Previous Semester</Label>
                <Select value={String(currentSemester)} onValueChange={v => setCurrentSemester(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Current CGPA</Label>
                <Input
                  type="number"
                  min={0}
                  max={gradingScale}
                  step={0.01}
                  value={currentCGPA || ""}
                  onChange={e => setCurrentCGPA(Math.min(gradingScale, Math.max(0, parseFloat(e.target.value) || 0)))}
                  placeholder={`0 - ${gradingScale}`}
                  className="text-lg font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Total Credits Completed</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={completedCredits || ""}
                  onChange={e => setCompletedCredits(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="e.g. 100"
                  className="text-lg font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Grading Scale</Label>
                <Select value={String(gradingScale)} onValueChange={v => setGradingScale(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10-Point Scale</SelectItem>
                    <SelectItem value="4">4-Point Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2: Future Semesters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-primary/30 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg text-card-foreground">🎯 Future Semesters</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground text-sm">Semesters to predict:</Label>
                <Select value={String(futureCount)} onValueChange={v => setFutureCount(Number(v))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {maxFutureSemesters > 0 ? (
                      Array.from({ length: maxFutureSemesters }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="0" disabled>No remaining</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="popLayout">
              {futureSemesters.map((sem, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                     <span className="font-semibold text-card-foreground text-sm">Semester {sem.semNumber}</span>
                      <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">🎯 What-If</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Credits</Label>
                      <Input
                        type="number"
                        min={1}
                        value={sem.credits || ""}
                        onChange={e => updateFutureSem(i, "credits", Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">SGPA ({sem.sgpa.toFixed(1)})</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          min={0}
                          max={gradingScale}
                          step={0.1}
                          value={[sem.sgpa]}
                          onValueChange={([v]) => updateFutureSem(i, "sgpa", v)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={gradingScale}
                          step={0.1}
                          value={sem.sgpa}
                          onChange={e => updateFutureSem(i, "sgpa", Math.min(gradingScale, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-20 h-9 text-center font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>


      {/* Section 4: Results */}
      {projectedCGPA !== null && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className={`border-2 ${tier?.color.replace("text-", "border-")} bg-card`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-card-foreground">📊 Your Projected CGPA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-1">
                <motion.div
                  key={projectedCGPA.toFixed(2)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-5xl md:text-6xl font-bold ${tier?.color}`}
                >
                  {projectedCGPA.toFixed(2)}
                </motion.div>
                <Badge className={`${tier?.bg} ${tier?.color} border-0 text-sm`}>
                  {tier?.emoji} {tier?.label}
                </Badge>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="text-muted-foreground">Previous: <strong className="text-card-foreground">{currentCGPA.toFixed(2)}</strong></span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Projected: <strong className={tier?.color}>{projectedCGPA.toFixed(2)}</strong></span>
                {delta !== null && (
                  <span className={`flex items-center gap-1 font-semibold ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {delta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{progressPercent.toFixed(1)}%</span>
                  <span>{gradingScale}</span>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Progress value={progressPercent} className="h-3" />
                </motion.div>
              </div>

              {milestone && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-primary font-medium"
                >
                  {milestone}
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Section 5: Reverse Calculator */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">🎯 Required SGPA Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label className="text-muted-foreground">What CGPA do you want to achieve?</Label>
                <Input
                  type="number"
                  min={0}
                  max={gradingScale}
                  step={0.1}
                  value={targetCGPA || ""}
                  onChange={e => setTargetCGPA(Math.min(gradingScale, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="text-lg font-semibold"
                />
              </div>
              {requiredSGPA !== null && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl border border-border bg-muted/50 flex-1"
                >
                  <p className="text-sm text-muted-foreground mb-1">You need an average SGPA of</p>
                  <p className={`text-3xl font-bold ${requiredSGPA <= gradingScale && requiredSGPA >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {requiredSGPA.toFixed(2)}
                  </p>
                  <p className="text-sm mt-1">
                    {requiredSGPA <= gradingScale && requiredSGPA >= 0 ? (
                      <span className="text-green-400 font-medium">Achievable ✅</span>
                    ) : (
                      <span className="text-red-400 font-medium">Not possible ❌</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">in each remaining semester to reach {targetCGPA.toFixed(1)} CGPA</p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 6: Save & Share */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-wrap gap-3 justify-center pb-8">
        <Button onClick={handleSave} variant="outline" className="gap-2">
          <Save className="w-4 h-4" /> Save Progress
        </Button>
        <Button onClick={handleShare} variant="outline" className="gap-2">
          <Share2 className="w-4 h-4" /> Share on WhatsApp
        </Button>
      </motion.div>
    </div>
  );
}
