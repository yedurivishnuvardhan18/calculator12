import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Save, Share2, ArrowUp, ArrowDown, Minus, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const STORAGE_KEY = "whatif_calculator_state";

interface SemesterData {
  credits: number;
  sgpa: number;
  isWhatIf: boolean;
}

interface ScenarioData {
  label: string;
  emoji: string;
  defaultOffset: number;
  sgpaOverrides: Record<number, number>;
}

interface SavedState {
  totalSemesters: number;
  gradingScale: number;
  uniformCredits: boolean;
  defaultCredits: number;
  semesters: SemesterData[];
  savedAt: string;
}

function getCGPATier(cgpa: number, scale: number) {
  const ratio = cgpa / scale;
  if (ratio >= 0.9) return { label: "Outstanding", emoji: "🏆", colorClass: "text-warning" };
  if (ratio >= 0.8) return { label: "Distinction", emoji: "🥇", colorClass: "text-success" };
  if (ratio >= 0.7) return { label: "Good", emoji: "🥈", colorClass: "text-primary" };
  if (ratio >= 0.6) return { label: "Average", emoji: "🥉", colorClass: "text-warning" };
  return { label: "Needs Improvement", emoji: "🔴", colorClass: "text-destructive" };
}

function getMilestoneMessage(cgpa: number, scale: number): string | null {
  const thresholds = [
    { value: scale * 0.9, label: "Outstanding" },
    { value: scale * 0.8, label: "Distinction" },
    { value: scale * 0.7, label: "Good Standing" },
    { value: scale * 0.6, label: "Average" },
  ];
  for (const t of thresholds) {
    const diff = t.value - cgpa;
    if (diff > 0 && diff <= 0.5) {
      return `You are just ${diff.toFixed(2)} away from ${t.label}! 🎯`;
    }
  }
  return null;
}

export default function WhatIfCalculator() {
  const [totalSemesters, setTotalSemesters] = useState(8);
  const [gradingScale, setGradingScale] = useState(10);
  const [uniformCredits, setUniformCredits] = useState(true);
  const [defaultCredits, setDefaultCredits] = useState(20);
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [targetCGPA, setTargetCGPA] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [scenarios, setScenarios] = useState<ScenarioData[]>([
    { label: "Pessimistic", emoji: "😴", defaultOffset: -1, sgpaOverrides: {} },
    { label: "Realistic", emoji: "😐", defaultOffset: 0, sgpaOverrides: {} },
    { label: "Optimistic", emoji: "🔥", defaultOffset: 1, sgpaOverrides: {} },
  ]);

  // Initialize semesters
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: SavedState = JSON.parse(saved);
        setTotalSemesters(state.totalSemesters);
        setGradingScale(state.gradingScale);
        setUniformCredits(state.uniformCredits);
        setDefaultCredits(state.defaultCredits);
        setSemesters(state.semesters);
        setLoaded(true);
        toast.success("Welcome back! Your last session is loaded ✅");
        return;
      } catch { /* ignore */ }
    }
    initSemesters(8, 20);
    setLoaded(true);
  }, []);

  const initSemesters = (count: number, credits: number) => {
    setSemesters(
      Array.from({ length: count }, (_, i) => ({
        credits,
        sgpa: 0,
        isWhatIf: i >= Math.ceil(count / 2),
      }))
    );
  };

  // Handle total semesters change
  const handleTotalSemestersChange = (val: string) => {
    const num = parseInt(val);
    setTotalSemesters(num);
    initSemesters(num, defaultCredits);
    setScenarios(s => s.map(sc => ({ ...sc, sgpaOverrides: {} })));
  };

  // Update individual semester
  const updateSemester = useCallback((index: number, field: keyof SemesterData, value: number | boolean) => {
    setSemesters(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }, []);

  // Handle uniform credits change
  useEffect(() => {
    if (uniformCredits) {
      setSemesters(prev => prev.map(s => ({ ...s, credits: defaultCredits })));
    }
  }, [uniformCredits, defaultCredits]);

  // Calculate CGPA from semester data with optional overrides
  const calculateCGPA = useCallback((semData: SemesterData[], overrides?: Record<number, number>) => {
    let totalPoints = 0;
    let totalCredits = 0;
    for (let i = 0; i < semData.length; i++) {
      const sem = semData[i];
      const sgpa = overrides && overrides[i] !== undefined ? overrides[i] : sem.sgpa;
      if (sgpa > 0) {
        totalPoints += sgpa * sem.credits;
        totalCredits += sem.credits;
      }
    }
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }, []);

  // Main CGPA
  const mainCGPA = useMemo(() => calculateCGPA(semesters), [semesters, calculateCGPA]);

  // Previous CGPA (completed semesters only)
  const previousCGPA = useMemo(() => {
    const completed = semesters.filter(s => !s.isWhatIf && s.sgpa > 0);
    if (completed.length === 0) return 0;
    const totalPoints = completed.reduce((sum, s) => sum + s.sgpa * s.credits, 0);
    const totalCredits = completed.reduce((sum, s) => sum + s.credits, 0);
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }, [semesters]);

  const cgpaDelta = mainCGPA - previousCGPA;

  // Scenario CGPAs
  const scenarioCGPAs = useMemo(() => {
    return scenarios.map(scenario => {
      const overrides: Record<number, number> = {};
      semesters.forEach((sem, i) => {
        if (sem.isWhatIf) {
          if (scenario.sgpaOverrides[i] !== undefined) {
            overrides[i] = scenario.sgpaOverrides[i];
          } else {
            const base = sem.sgpa || (gradingScale * 0.7);
            overrides[i] = Math.max(0, Math.min(gradingScale, base + scenario.defaultOffset));
          }
        }
      });
      return calculateCGPA(semesters, overrides);
    });
  }, [semesters, scenarios, calculateCGPA, gradingScale]);

  // Reverse calculator
  const requiredSGPA = useMemo(() => {
    const target = parseFloat(targetCGPA);
    if (isNaN(target) || target <= 0) return null;

    const completedPoints = semesters
      .filter(s => !s.isWhatIf && s.sgpa > 0)
      .reduce((sum, s) => sum + s.sgpa * s.credits, 0);
    const completedCredits = semesters
      .filter(s => !s.isWhatIf && s.sgpa > 0)
      .reduce((sum, s) => sum + s.credits, 0);
    const remainingCredits = semesters
      .filter(s => s.isWhatIf)
      .reduce((sum, s) => sum + s.credits, 0);

    if (remainingCredits === 0) return null;

    const totalCredits = completedCredits + remainingCredits;
    const needed = (target * totalCredits - completedPoints) / remainingCredits;
    return needed;
  }, [targetCGPA, semesters]);

  // Apply scenario to main table
  const applyScenario = (scenarioIndex: number) => {
    const scenario = scenarios[scenarioIndex];
    setSemesters(prev => prev.map((sem, i) => {
      if (!sem.isWhatIf) return sem;
      if (scenario.sgpaOverrides[i] !== undefined) {
        return { ...sem, sgpa: scenario.sgpaOverrides[i] };
      }
      const base = sem.sgpa || (gradingScale * 0.7);
      return { ...sem, sgpa: Math.max(0, Math.min(gradingScale, base + scenario.defaultOffset)) };
    }));
    toast.success(`${scenario.emoji} ${scenario.label} scenario applied!`);
  };

  // Update scenario override
  const updateScenarioOverride = (scenarioIndex: number, semIndex: number, value: number) => {
    setScenarios(prev => prev.map((s, i) =>
      i === scenarioIndex
        ? { ...s, sgpaOverrides: { ...s.sgpaOverrides, [semIndex]: value } }
        : s
    ));
  };

  // Save
  const handleSave = () => {
    const state: SavedState = {
      totalSemesters, gradingScale, uniformCredits, defaultCredits, semesters,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    toast.success("💾 Saved successfully!");
  };

  // Reset
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTotalSemesters(8);
    setGradingScale(10);
    setUniformCredits(true);
    setDefaultCredits(20);
    setTargetCGPA("");
    initSemesters(8, 20);
    setScenarios(s => s.map(sc => ({ ...sc, sgpaOverrides: {} })));
    toast.success("🔄 Reset complete!");
  };

  // Share
  const handleShare = () => {
    const whatIfSems = semesters.filter(s => s.isWhatIf && s.sgpa > 0);
    const whatIfText = whatIfSems.length > 0
      ? whatIfSems.map((s, i) => `Sem ${semesters.indexOf(s) + 1}: ${s.sgpa}`).join(", ")
      : "my future semesters";
    const text = `What-If I score ${whatIfText}? My CGPA will be ${mainCGPA.toFixed(2)}! 🎓 Try it at gradegurubyteamdino.vercel.app/what-if`;

    if (navigator.share) {
      navigator.share({ title: "GradeGuru What-If Calculator", text }).catch(() => {});
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const tier = getCGPATier(mainCGPA, gradingScale);
  const milestone = getMilestoneMessage(mainCGPA, gradingScale);
  const progressPercent = gradingScale > 0 ? (mainCGPA / gradingScale) * 100 : 0;
  const whatIfSemesterIndices = semesters.map((s, i) => s.isWhatIf ? i : -1).filter(i => i >= 0);

  if (!loaded) return null;

  return (
    <div className="container max-w-4xl py-6 pb-24 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Target className="w-4 h-4" />
          What-If Calculator
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          SGPA → CGPA What-If Calculator
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Enter your completed semester SGPAs and predict your future CGPA with different scenarios
        </p>
      </motion.div>

      {/* Setup */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">⚙️ Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Total Semesters</Label>
              <Select value={String(totalSemesters)} onValueChange={handleTotalSemestersChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Semesters</SelectItem>
                  <SelectItem value="6">6 Semesters</SelectItem>
                  <SelectItem value="8">8 Semesters</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Grading Scale</Label>
              <Select value={String(gradingScale)} onValueChange={v => setGradingScale(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10-Point Scale</SelectItem>
                  <SelectItem value="4">4-Point Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Credits per Semester</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={defaultCredits}
                  onChange={e => setDefaultCredits(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={!uniformCredits}
                  className="h-9"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <Switch checked={uniformCredits} onCheckedChange={setUniformCredits} id="uniform" />
                  <Label htmlFor="uniform" className="text-xs text-muted-foreground whitespace-nowrap">Uniform</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semester Table */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">📊 Semester SGPA Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Header row - desktop */}
          <div className="hidden sm:grid sm:grid-cols-[100px_80px_1fr_100px] gap-2 text-xs text-muted-foreground font-medium px-1 pb-1">
            <span>Semester</span>
            <span>Credits</span>
            <span>SGPA</span>
            <span>Type</span>
          </div>

          {semesters.map((sem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-lg border p-3 transition-colors ${
                sem.isWhatIf
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-[100px_80px_1fr_100px] gap-2 items-center">
                <span className="text-sm font-medium text-foreground">Sem {i + 1}</span>

                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={sem.credits}
                  onChange={e => updateSemester(i, "credits", Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={uniformCredits}
                  className="h-8 text-sm w-full"
                />

                <div className="col-span-2 sm:col-span-1">
                  {sem.isWhatIf ? (
                    <div className="flex items-center gap-2">
                      <Slider
                        min={0}
                        max={gradingScale}
                        step={0.1}
                        value={[sem.sgpa]}
                        onValueChange={([v]) => updateSemester(i, "sgpa", v)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={gradingScale}
                        step={0.1}
                        value={sem.sgpa || ""}
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          updateSemester(i, "sgpa", isNaN(v) ? 0 : Math.min(gradingScale, Math.max(0, v)));
                        }}
                        className="h-8 w-20 text-sm shrink-0"
                      />
                    </div>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      max={gradingScale}
                      step={0.01}
                      value={sem.sgpa || ""}
                      placeholder="0.00"
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        updateSemester(i, "sgpa", isNaN(v) ? 0 : Math.min(gradingScale, Math.max(0, v)));
                      }}
                      className="h-8 text-sm"
                    />
                  )}
                </div>

                <button
                  onClick={() => updateSemester(i, "isWhatIf", !sem.isWhatIf)}
                  className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                    sem.isWhatIf
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {sem.isWhatIf ? "🎯 What-If" : "✅ Done"}
                </button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Scenarios */}
      {whatIfSemesterIndices.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">🎯 Try Different Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {scenarios.map((scenario, si) => (
                <motion.div
                  key={scenario.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => applyScenario(si)}
                >
                  <div className="text-center">
                    <span className="text-xl">{scenario.emoji}</span>
                    <p className="text-sm font-semibold text-foreground mt-1">{scenario.label}</p>
                  </div>

                  {whatIfSemesterIndices.map(semIdx => (
                    <div key={semIdx} className="space-y-1" onClick={e => e.stopPropagation()}>
                      <Label className="text-xs text-muted-foreground">Sem {semIdx + 1}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={gradingScale}
                        step={0.1}
                        value={scenario.sgpaOverrides[semIdx] ?? Math.max(0, Math.min(gradingScale, (semesters[semIdx]?.sgpa || gradingScale * 0.7) + scenario.defaultOffset))}
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          updateScenarioOverride(si, semIdx, isNaN(v) ? 0 : Math.min(gradingScale, Math.max(0, v)));
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}

                  <div className="text-center pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Projected CGPA</p>
                    <p className="text-2xl font-bold font-display text-foreground">
                      {scenarioCGPAs[si] > 0 ? scenarioCGPAs[si].toFixed(2) : "—"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {mainCGPA > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-primary/20 bg-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">📊 Your Projected CGPA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <motion.div
                    key={mainCGPA.toFixed(2)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center w-28 h-28 rounded-2xl border-2 border-primary/20 bg-primary/5"
                  >
                    <span className="text-4xl font-bold font-display text-foreground">{mainCGPA.toFixed(2)}</span>
                  </motion.div>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{tier.emoji}</span>
                    <span className={`text-sm font-semibold ${tier.colorClass}`}>{tier.label}</span>
                  </div>
                </div>

                {previousCGPA > 0 && (
                  <div className="flex items-center justify-between text-sm px-2">
                    <span className="text-muted-foreground">Previous CGPA (completed):</span>
                    <span className="font-medium text-foreground">{previousCGPA.toFixed(2)}</span>
                  </div>
                )}

                {previousCGPA > 0 && (
                  <div className="flex items-center justify-between text-sm px-2">
                    <span className="text-muted-foreground">After What-If:</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      {mainCGPA.toFixed(2)}
                      {cgpaDelta > 0 ? (
                        <Badge variant="outline" className="text-success border-success/30 text-xs gap-0.5">
                          <ArrowUp className="w-3 h-3" /> +{cgpaDelta.toFixed(2)}
                        </Badge>
                      ) : cgpaDelta < 0 ? (
                        <Badge variant="outline" className="text-destructive border-destructive/30 text-xs gap-0.5">
                          <ArrowDown className="w-3 h-3" /> {cgpaDelta.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs gap-0.5">
                          <Minus className="w-3 h-3" /> 0.00
                        </Badge>
                      )}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 px-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progressPercent.toFixed(1)}%</span>
                  </div>
                  <motion.div
                    key={progressPercent}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                  >
                    <Progress value={progressPercent} className="h-3" />
                  </motion.div>
                </div>

                {milestone && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-center text-primary font-medium bg-primary/5 rounded-lg p-3"
                  >
                    {milestone}
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reverse Calculator */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">🎯 Required SGPA Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            What SGPA do I need in remaining semesters to achieve my target CGPA?
          </p>
          <div className="flex items-center gap-3">
            <Label className="text-sm shrink-0">Target CGPA:</Label>
            <Input
              type="number"
              min={0}
              max={gradingScale}
              step={0.01}
              value={targetCGPA}
              onChange={e => setTargetCGPA(e.target.value)}
              placeholder={`e.g. ${(gradingScale * 0.8).toFixed(1)}`}
              className="h-9 w-32"
            />
          </div>

          {requiredSGPA !== null && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 border ${
                requiredSGPA <= gradingScale && requiredSGPA >= 0
                  ? "border-success/30 bg-success/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              {requiredSGPA <= gradingScale && requiredSGPA >= 0 ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-success">Achievable ✅</p>
                  <p className="text-sm text-foreground">
                    You need an SGPA of <strong>{requiredSGPA.toFixed(2)}</strong> in each remaining semester
                    to reach CGPA {parseFloat(targetCGPA).toFixed(2)}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Not possible ❌</p>
                  <p className="text-sm text-foreground">
                    You would need SGPA {requiredSGPA.toFixed(2)}, which exceeds the {gradingScale}-point scale
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={handleSave} variant="outline" className="gap-2">
          <Save className="w-4 h-4" /> Save
        </Button>
        <Button onClick={handleShare} variant="outline" className="gap-2">
          <Share2 className="w-4 h-4" /> Share
        </Button>
        <Button onClick={handleReset} variant="ghost" className="gap-2 text-muted-foreground">
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>
    </div>
  );
}
