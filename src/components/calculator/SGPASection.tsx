import { Course, calculateSGPA } from "@/types/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Award, Download, Share2 } from "lucide-react";
import { generateGradeCard } from "@/lib/gradecard-generator";
import { useState, useEffect, useRef } from "react";
import { GradeBadge } from "./GradeBadge";
import confetti from "canvas-confetti";

interface SGPASectionProps {
  courses: Course[];
  onShowCGPA: () => void;
  cgpaData?: {
    cgpa: number;
    previousCGPA: number;
    previousCredits: number;
    newTotalCredits: number;
  };
}

export function SGPASection({ courses, onShowCGPA, cgpaData }: SGPASectionProps) {
  const [showResult, setShowResult] = useState(false);
  const hasTriggeredConfetti = useRef(false);
  
  const validCourses = courses.filter(c => c.finalGradePoint !== null && c.name.trim() !== '');
  const canCalculate = validCourses.length > 0;
  const result = calculateSGPA(validCourses);

  useEffect(() => {
    if (showResult && result && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      const colors = ['#FF6B9D', '#FFE66D', '#4ECDC4', '#A855F7', '#FF8C42', '#10B981'];
      
      if (result.sgpa >= 9) {
        // 🎉 Extra celebration for high SGPA!
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors, scalar: 1.2 });
        setTimeout(() => {
          confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors });
          confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors });
        }, 200);
        setTimeout(() => {
          confetti({ particleCount: 60, spread: 90, origin: { y: 0.7 }, colors, scalar: 1.5 });
        }, 500);
      } else {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors });
        setTimeout(() => {
          confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors });
          confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors });
        }, 250);
      }
    }
  }, [showResult, result]);

  useEffect(() => {
    if (!showResult) hasTriggeredConfetti.current = false;
  }, [showResult]);

  if (!canCalculate) {
    return (
      <Card className="border-dashed border-3 border-pop-cyan/40 animate-fade-in rounded-3xl bg-card/80 backdrop-blur-sm">
        <CardContent className="py-8 sm:py-10 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-pop-cyan/20 flex items-center justify-center mx-auto mb-4 rotate-6">
            <Calculator className="w-7 h-7 sm:w-8 sm:h-8 text-pop-cyan" />
          </div>
          <p className="text-muted-foreground text-sm sm:text-base font-medium">
            Complete at least one course to calculate SGPA
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in border-3 border-pop-green/40 rounded-3xl pop-shadow-lg overflow-hidden bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3 sm:pb-4 bg-pop-green/10">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-pop-green flex items-center justify-center flex-shrink-0 pop-shadow -rotate-3">
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="leading-tight font-bold font-display">Step 3: SGPA Calculation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pt-4 px-4 sm:px-6">
        {!showResult ? (
          <div className="text-center py-5 sm:py-6">
            <p className="text-muted-foreground mb-5 text-sm sm:text-base">
              You have <span className="font-bold text-foreground bg-pop-green/20 px-2 py-0.5 rounded-full">{validCourses.length}</span> course(s) ready for SGPA calculation.
            </p>
            <Button 
              onClick={() => setShowResult(true)} 
              size="lg"
              className="bg-pop-green hover:bg-pop-green/90 text-white font-bold font-display rounded-full px-6 sm:px-8 pop-shadow transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:pop-shadow-lg active:scale-95"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calculate SGPA
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 animate-bounce-in">
            <div className="bg-card rounded-2xl border-2 border-foreground/10 overflow-x-auto pop-shadow">
              <table className="w-full min-w-[300px]">
                <thead>
                  <tr className="border-b-2 border-foreground/10 bg-muted/50">
                    <th className="text-left p-2.5 sm:p-4 text-xs sm:text-sm font-bold font-display">Course</th>
                    <th className="text-center p-2.5 sm:p-4 text-xs sm:text-sm font-bold font-display">Cr</th>
                    <th className="text-center p-2.5 sm:p-4 text-xs sm:text-sm font-bold font-display">Grade</th>
                    <th className="text-center p-2.5 sm:p-4 text-xs sm:text-sm font-bold font-display whitespace-nowrap">Cr × GP</th>
                  </tr>
                </thead>
                <tbody>
                  {validCourses.map((course, i) => (
                    <tr key={course.id} className="border-b border-foreground/5 last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 sm:p-4 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none font-medium">
                        {course.name || `Course ${i + 1}`}
                      </td>
                      <td className="p-2.5 sm:p-4 text-center text-xs sm:text-sm">
                        <span className="bg-muted px-2 py-0.5 rounded-full font-bold">{course.credits}</span>
                      </td>
                      <td className="p-2.5 sm:p-4 text-center">
                        <GradeBadge letter={course.letterGrade!} point={course.finalGradePoint!} size="sm" />
                      </td>
                      <td className="p-2.5 sm:p-4 text-center font-mono text-xs sm:text-sm">
                        <span className="hidden sm:inline text-muted-foreground">{course.credits} × {course.finalGradePoint} = </span>
                        <span className="font-bold bg-pop-green/20 px-2 py-0.5 rounded-full">{(course.credits * course.finalGradePoint!).toFixed(0)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Card className="bg-muted/30 border-dashed border-2 border-pop-green/30 rounded-2xl">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2 text-pop-green font-bold font-display">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  SGPA Formula
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm px-4 sm:px-6">
                <div className="font-mono bg-card p-3 sm:p-4 rounded-xl border-2 border-foreground/10 space-y-1.5 overflow-x-auto">
                  <div className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
                    SGPA = Σ(Credits × Grade Point) ÷ Σ(Total Credits)
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap text-xs">
                    SGPA = {result?.totalGradePoints.toFixed(0)} ÷ {result?.totalCredits}
                  </div>
                  <div className="text-foreground font-bold text-lg sm:text-xl">
                    SGPA = <span className="text-pop-green bg-pop-green/10 px-2 py-0.5 rounded-lg">{result?.sgpa.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center gap-3 sm:gap-5 p-5 sm:p-8 bg-gradient-to-br from-pop-green/10 to-pop-cyan/10 rounded-3xl border-3 border-pop-green/30 pop-shadow-lg">
              <div className="text-center">
                <div className="text-5xl sm:text-7xl font-black font-display text-pop-green drop-shadow-md animate-pop-in">{result?.sgpa.toFixed(2)}</div>
                {result && result.sgpa >= 9 && (
                  <div className="text-pop-pink font-bold text-sm sm:text-base mt-1 animate-fade-in">
                    🔥 Outstanding performance! 🔥
                  </div>
                )}
                <div className="text-muted-foreground mt-2 text-xs sm:text-sm font-medium">Your SGPA for this semester 🎉</div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                <span className="bg-card px-3 py-1.5 rounded-full border-2 border-foreground/10">
                  Total Credits: <strong className="text-foreground">{result?.totalCredits}</strong>
                </span>
                <span className="bg-card px-3 py-1.5 rounded-full border-2 border-foreground/10">
                  Grade Points: <strong className="text-foreground">{result?.totalGradePoints.toFixed(0)}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
              <Button 
                variant="outline" 
                onClick={onShowCGPA} 
                size="lg"
                className="w-full sm:w-auto sm:flex-1 rounded-full border-3 border-pop-orange font-bold font-display text-pop-orange hover:bg-pop-orange hover:text-white transition-all duration-300 hover:scale-[1.02] hover:pop-shadow active:scale-95"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Calculate CGPA (Optional)
              </Button>
              <Button 
                onClick={() => generateGradeCard(courses, result!, cgpaData)}
                size="lg"
                className="w-full sm:w-auto sm:flex-1 rounded-full bg-pop-pink hover:bg-pop-pink/90 text-white font-bold font-display transition-all duration-300 hover:scale-[1.02] hover:pop-shadow active:scale-95"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Grade Card
              </Button>
            </div>

            {/* Share Buttons */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <p className="text-xs text-muted-foreground font-medium">Share your results</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-2 border-pop-green/40 text-pop-green hover:bg-pop-green hover:text-white text-xs font-bold"
                  onClick={() => {
                    const text = `🎓 My SGPA: ${result?.sgpa.toFixed(2)}!\nTotal Credits: ${result?.totalCredits} | Grade Points: ${result?.totalGradePoints.toFixed(0)}\n${result && result.sgpa >= 9 ? '🔥 Outstanding!' : '✨'}\nCalculated on habbittrackerpro.lovable.app`;
                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }}
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-2 border-pop-cyan/40 text-pop-cyan hover:bg-pop-cyan hover:text-white text-xs font-bold"
                  onClick={() => {
                    const text = `🎓 My SGPA: ${result?.sgpa.toFixed(2)}! ${result && result.sgpa >= 9 ? '🔥' : '✨'}\nCalculated on habbittrackerpro.lovable.app`;
                    navigator.clipboard.writeText(text);
                    // Use native share if available
                    if (navigator.share) {
                      navigator.share({ title: 'My Grade Card', text });
                    }
                  }}
                >
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
