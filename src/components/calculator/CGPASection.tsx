import { calculateCGPA, Course, calculateSGPA } from "@/types/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Calculator, ArrowRight, Download } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import confetti from "canvas-confetti";
import { generateGradeCard } from "@/lib/gradecard-generator";

interface CGPASectionProps {
  currentSGPA: number;
  currentCredits: number;
  courses: Course[];
  onCGPACalculated?: (data: { cgpa: number; previousCGPA: number; previousCredits: number; newTotalCredits: number } | null) => void;
}

export function CGPASection({ currentSGPA, currentCredits, courses, onCGPACalculated }: CGPASectionProps) {
  const [previousCGPA, setPreviousCGPA] = useState<string>('');
  const [previousCredits, setPreviousCredits] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const hasTriggeredConfetti = useRef(false);

  const canCalculate = previousCGPA !== '' && previousCredits !== '' && 
    parseFloat(previousCGPA) >= 0 && parseFloat(previousCGPA) <= 10 &&
    parseInt(previousCredits) > 0;

  const result = useMemo(() => {
    if (!canCalculate) return null;
    return calculateCGPA(currentSGPA, currentCredits, parseFloat(previousCGPA), parseInt(previousCredits));
  }, [canCalculate, currentSGPA, currentCredits, previousCGPA, previousCredits]);

  useEffect(() => {
    if (showResult && result && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      const colors = ['#FF8C42', '#FFE66D', '#FF6B9D', '#4ECDC4', '#A855F7', '#10B981'];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors });
        confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors });
      }, 200);
    }
  }, [showResult, result]);

  useEffect(() => {
    if (!showResult) hasTriggeredConfetti.current = false;
  }, [showResult]);

  const cgpa = result?.cgpa;
  const totalCredits = result?.totalCredits;
  
  useEffect(() => {
    if (showResult && cgpa !== undefined && totalCredits !== undefined) {
      onCGPACalculated?.({ cgpa, previousCGPA: parseFloat(previousCGPA), previousCredits: parseInt(previousCredits), newTotalCredits: totalCredits });
    } else if (!showResult) {
      onCGPACalculated?.(null);
    }
  }, [showResult, cgpa, totalCredits, previousCGPA, previousCredits, onCGPACalculated]);

  return (
    <Card className="animate-fade-in border-3 border-pop-orange/40 rounded-3xl pop-shadow-lg overflow-hidden bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 sm:pb-4 bg-pop-orange/10">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-pop-orange flex items-center justify-center flex-shrink-0 pop-shadow rotate-3">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="leading-tight font-bold font-display">Step 4: New CGPA (Optional)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pt-4 px-4 sm:px-6">
        <p className="text-muted-foreground text-xs sm:text-sm font-medium">
          Enter your previous academic record to calculate your updated cumulative GPA.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
          <div className="space-y-2">
            <Label htmlFor="prev-cgpa" className="text-sm font-bold font-display">Previous CGPA</Label>
            <Input
              id="prev-cgpa"
              aria-label="Enter your previous CGPA"
              type="number"
              step={0.01}
              min={0}
              max={10}
              placeholder="e.g., 8.5"
              value={previousCGPA}
              onChange={(e) => { setPreviousCGPA(e.target.value); setShowResult(false); }}
              className="bg-card rounded-2xl border-2 border-foreground/10 focus:border-pop-orange h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prev-credits" className="text-sm font-bold font-display">Previous Total Credits</Label>
            <Input
              id="prev-credits"
              aria-label="Enter your previous total credits"
              type="number"
              min={1}
              placeholder="e.g., 120"
              value={previousCredits}
              onChange={(e) => { setPreviousCredits(e.target.value); setShowResult(false); }}
              className="bg-card rounded-2xl border-2 border-foreground/10 focus:border-pop-orange h-12"
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-2xl border-2 border-foreground/10 p-4 sm:p-5">
          <h4 className="text-xs sm:text-sm font-bold mb-3 font-display">Current Semester</h4>
          <div className="flex flex-wrap items-center gap-2 sm:gap-5 text-xs sm:text-sm text-muted-foreground">
            <span className="bg-card px-3 py-1.5 rounded-full border-2 border-foreground/10">
              SGPA: <strong className="text-foreground">{currentSGPA.toFixed(2)}</strong>
            </span>
            <span className="bg-card px-3 py-1.5 rounded-full border-2 border-foreground/10">
              Credits: <strong className="text-foreground">{currentCredits}</strong>
            </span>
          </div>
        </div>

        {!showResult && (
          <div className="text-center pt-2">
            <Button 
              onClick={() => setShowResult(true)} 
              disabled={!canCalculate}
              className="bg-pop-orange hover:bg-pop-orange/90 text-white font-bold font-display rounded-full px-6 sm:px-8 pop-shadow transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:pop-shadow-lg disabled:opacity-50 disabled:hover:scale-100 active:scale-95"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calculate New CGPA
            </Button>
          </div>
        )}

        {showResult && result && (
          <div className="space-y-4 sm:space-y-6 animate-bounce-in">
            <Card className="bg-muted/30 border-dashed border-2 border-pop-orange/30 rounded-2xl">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2 text-pop-orange font-bold font-display">
                  <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                  CGPA Formula
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm px-4 sm:px-6">
                <div className="font-mono bg-card p-3 sm:p-4 rounded-xl border-2 border-foreground/10 space-y-1.5 overflow-x-auto">
                  <div className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
                    New CGPA = [(Prev CGPA × Prev Credits) + (SGPA × Credits)] ÷ Total Credits
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap text-xs">
                    = [({previousCGPA} × {previousCredits}) + ({currentSGPA.toFixed(2)} × {currentCredits})] ÷ {result.totalCredits}
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap text-xs">
                    = [{(parseFloat(previousCGPA) * parseInt(previousCredits)).toFixed(2)} + {(currentSGPA * currentCredits).toFixed(2)}] ÷ {result.totalCredits}
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap text-xs">
                    = {result.totalGradePoints.toFixed(2)} ÷ {result.totalCredits}
                  </div>
                  <div className="text-foreground font-bold text-lg sm:text-xl">
                    New CGPA = <span className="text-pop-orange bg-pop-orange/10 px-2 py-0.5 rounded-lg">{result.cgpa.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 p-5 sm:p-8 bg-gradient-to-br from-pop-orange/10 to-pop-yellow/10 rounded-3xl border-3 border-pop-orange/30 pop-shadow-lg">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold font-display text-muted-foreground">{previousCGPA}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1">Previous CGPA</div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-pop-orange/20 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-pop-orange rotate-90 sm:rotate-0" />
              </div>
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-black font-display text-pop-orange drop-shadow-md animate-pop-in">{result.cgpa.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">New CGPA 🎉</div>
              </div>
            </div>

            <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-3">
              <span className="bg-card px-4 py-2 rounded-full border-2 border-foreground/10 inline-block">
                Total Credits Completed: <strong className="text-foreground">{result.totalCredits}</strong>
              </span>
              <div>
                <Button
                  onClick={() => {
                    const sgpaResult = calculateSGPA(courses.filter(c => c.finalGradePoint !== null && c.name.trim() !== ''));
                    if (sgpaResult) {
                      generateGradeCard(courses, sgpaResult, {
                        cgpa: result.cgpa,
                        previousCGPA: parseFloat(previousCGPA),
                        previousCredits: parseInt(previousCredits),
                        newTotalCredits: result.totalCredits,
                      });
                    }
                  }}
                  size="lg"
                  className="rounded-full bg-pop-pink hover:bg-pop-pink/90 text-white font-bold font-display transition-all duration-300 hover:scale-[1.02] hover:pop-shadow active:scale-95"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Grade Card
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
