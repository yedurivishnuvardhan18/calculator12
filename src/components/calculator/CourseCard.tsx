import { useState } from "react";
import {
  Course,
  Assessment,
  calculateWGP,
  getGradeFromWGP,
  calculateFinalGradePointWithLab,
  calculateAbsoluteGrade,
  checkForFGrade,
  requiresMarksInput,
  getSessionalTotalMarks,
  getSessionalGradePoint,
  SPECIAL_SESSIONAL_GRADES,
  createDefaultAssessments,
} from "@/types/calculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, BookOpen, Lock, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradeBadge } from "./GradeBadge";
import { WGPFormula } from "./WGPFormula";

const SESSIONAL_GRADE_OPTIONS = [
  { label: "O", value: 10 },
  { label: "A+", value: 9 },
  { label: "A", value: 8 },
  { label: "B+", value: 7 },
  { label: "B", value: 6 },
  { label: "C", value: 5 },
  { label: "P", value: -1 },
  { label: "I", value: -1 },
  { label: "Ab/R", value: -1 },
];

const LE_GRADE_OPTIONS = [
  { label: "O", value: 10 },
  { label: "A+", value: 9 },
  { label: "A", value: 8 },
  { label: "B+", value: 7 },
  { label: "B", value: 6 },
  { label: "C", value: 5 },
  { label: "P", value: 4 },
  { label: "L/AB", value: 0 },
];

const CLAD_GRADE_OPTIONS = [
  { label: "O", value: 10 },
  { label: "A+", value: 9 },
  { label: "A", value: 8 },
  { label: "B+", value: 7 },
  { label: "B", value: 6 },
  { label: "C", value: 5 },
  { label: "P", value: 4 },
  { label: "I", value: 4 },
];

interface CourseCardProps {
  course: Course;
  index: number;
  onUpdate: (course: Course) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function CourseCard({
  course,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: CourseCardProps) {
  const isCLAD = course.name.trim().toLowerCase() === "clad";

  const getGradeOptions = (assessmentName: string) => {
    if (assessmentName === 'Learning Engagement') return LE_GRADE_OPTIONS;
    return SESSIONAL_GRADE_OPTIONS;
  };

  const recalculateCourse = (newAssessments: Assessment[]) => {
    const s1 = newAssessments.find(a => a.name === 'Sessional 1');
    const s2 = newAssessments.find(a => a.name === 'Sessional 2');
    
    const hasIorAbR = 
      s1?.gradeLabel === 'I' || s1?.gradeLabel === 'Ab/R' ||
      s2?.gradeLabel === 'I' || s2?.gradeLabel === 'Ab/R';
    
    const hasOnlyP = 
      (s1?.gradeLabel === 'P' || s2?.gradeLabel === 'P') && !hasIorAbR;
    
    if (hasIorAbR) {
      const { total, bothEntered } = getSessionalTotalMarks(newAssessments);
      
      if (!bothEntered) {
        const partialAssessments = newAssessments.map(a => {
          if ((a.name === 'Sessional 1' || a.name === 'Sessional 2') && a.gradeLabel === 'P') {
            return { ...a, gradePoint: 4 };
          }
          return a;
        });
        onUpdate({ ...course, assessments: partialAssessments, wgp: null, finalGradePoint: null, letterGrade: null });
        return;
      }
      
      const fGradeCheck = checkForFGrade(newAssessments);
      if (fGradeCheck.isF) {
        const updatedAssessments = newAssessments.map(a => {
          if ((a.name === 'Sessional 1' || a.name === 'Sessional 2') && SPECIAL_SESSIONAL_GRADES.includes(a.gradeLabel || '')) {
            return { ...a, gradePoint: getSessionalGradePoint(a.gradeLabel, total) };
          }
          return a;
        });
        onUpdate({ ...course, assessments: updatedAssessments, wgp: 0, finalGradePoint: 0, letterGrade: 'F' });
        return;
      }
      
      const updatedAssessments = newAssessments.map(a => {
        if ((a.name === 'Sessional 1' || a.name === 'Sessional 2') && SPECIAL_SESSIONAL_GRADES.includes(a.gradeLabel || '')) {
          return { ...a, gradePoint: getSessionalGradePoint(a.gradeLabel, total) };
        }
        return a;
      });
      
      const rawWGP = calculateWGP(updatedAssessments);
      const wgp = rawWGP !== null ? Math.min(10, Math.ceil(rawWGP)) : null;
      let finalGradePoint = null;
      let letterGrade = null;

      if (wgp !== null) {
        let effectiveGP = wgp;
        if (course.hasLab && course.labMarks !== null) {
          effectiveGP = calculateFinalGradePointWithLab(rawWGP!, course.labMarks);
        }
        const grade = getGradeFromWGP(effectiveGP);
        finalGradePoint = effectiveGP;
        letterGrade = grade.letter;
      }

      onUpdate({ ...course, assessments: updatedAssessments, wgp, finalGradePoint, letterGrade });
      return;
    }
    
    if (hasOnlyP) {
      const updatedAssessments = newAssessments.map(a => {
        if ((a.name === 'Sessional 1' || a.name === 'Sessional 2') && a.gradeLabel === 'P') {
          return { ...a, gradePoint: 4 };
        }
        return a;
      });
      
      const fGradeCheck = checkForFGrade(updatedAssessments);
      if (fGradeCheck.isF) {
        onUpdate({ ...course, assessments: updatedAssessments, wgp: 0, finalGradePoint: 0, letterGrade: 'F' });
        return;
      }
      
      const rawWGP = calculateWGP(updatedAssessments);
      const wgp = rawWGP !== null ? Math.min(10, Math.ceil(rawWGP)) : null;
      let finalGradePoint = null;
      let letterGrade = null;

      if (wgp !== null) {
        let effectiveGP = wgp;
        if (course.hasLab && course.labMarks !== null) {
          effectiveGP = calculateFinalGradePointWithLab(rawWGP!, course.labMarks);
        }
        const grade = getGradeFromWGP(effectiveGP);
        finalGradePoint = effectiveGP;
        letterGrade = grade.letter;
      }

      onUpdate({ ...course, assessments: updatedAssessments, wgp, finalGradePoint, letterGrade });
      return;
    }
    
    const fGradeCheck = checkForFGrade(newAssessments);
    if (fGradeCheck.isF) {
      onUpdate({ ...course, assessments: newAssessments, wgp: 0, finalGradePoint: 0, letterGrade: 'F' });
      return;
    }
    
    const rawWGP = calculateWGP(newAssessments);
    const wgp = rawWGP !== null ? Math.min(10, Math.ceil(rawWGP)) : null;
    let finalGradePoint = null;
    let letterGrade = null;

    if (wgp !== null) {
      let effectiveGP = wgp;
      if (course.hasLab && course.labMarks !== null) {
        effectiveGP = calculateFinalGradePointWithLab(rawWGP!, course.labMarks);
      }
      const grade = getGradeFromWGP(effectiveGP);
      finalGradePoint = effectiveGP;
      letterGrade = grade.letter;
    }

    onUpdate({ ...course, assessments: newAssessments, wgp, finalGradePoint, letterGrade });
  };

  const updateAssessmentGrade = (assessmentIndex: number, gradeLabel: string) => {
    const gradeOptions = getGradeOptions(course.assessments[assessmentIndex].name);
    const selected = gradeOptions.find(g => g.label === gradeLabel);
    
    if (!selected) {
      const newAssessments = course.assessments.map((a, i) =>
        i === assessmentIndex ? { ...a, gradePoint: null, gradeLabel: null, marks: null } : a
      );
      recalculateCourse(newAssessments);
      return;
    }
    
    if (SPECIAL_SESSIONAL_GRADES.includes(gradeLabel)) {
      const newAssessments = course.assessments.map((a, i) =>
        i === assessmentIndex ? { ...a, gradePoint: null, gradeLabel, marks: null } : a
      );
      recalculateCourse(newAssessments);
      return;
    }
    
    const newAssessments = course.assessments.map((a, i) =>
      i === assessmentIndex ? { ...a, gradePoint: selected.value, gradeLabel, marks: null } : a
    );
    recalculateCourse(newAssessments);
  };

  const updateAssessmentMarks = (assessmentIndex: number, marksValue: string) => {
    const marks = marksValue === "" ? null : Math.min(100, Math.max(0, parseFloat(marksValue)));
    const newAssessments = course.assessments.map((a, i) => {
      if (i !== assessmentIndex) return a;
      return { ...a, marks };
    });
    recalculateCourse(newAssessments);
  };
  
  const s1Assessment = course.assessments.find(a => a.name === 'Sessional 1');
  const s2Assessment = course.assessments.find(a => a.name === 'Sessional 2');
  const hasIorAbR = 
    s1Assessment?.gradeLabel === 'I' || s1Assessment?.gradeLabel === 'Ab/R' ||
    s2Assessment?.gradeLabel === 'I' || s2Assessment?.gradeLabel === 'Ab/R';
  const showMarksInputs = hasIorAbR;
  const { total: totalMarks, s1Marks, s2Marks, bothEntered } = getSessionalTotalMarks(course.assessments);

  const handleLabToggle = (checked: boolean) => {
    onUpdate({
      ...course,
      hasLab: checked,
      labMarks: checked ? course.labMarks ?? null : null,
      finalGradePoint: checked ? course.finalGradePoint : course.wgp,
    });
  };

  const popColors = [
    "border-pop-pink/40 bg-gradient-to-br from-pop-pink/5 to-pop-purple/5",
    "border-pop-cyan/40 bg-gradient-to-br from-pop-cyan/5 to-pop-green/5",
    "border-pop-green/40 bg-gradient-to-br from-pop-green/5 to-pop-cyan/5",
    "border-pop-orange/40 bg-gradient-to-br from-pop-orange/5 to-pop-yellow/5",
  ];

  const headerColors = [
    "bg-pop-pink/10",
    "bg-pop-cyan/10",
    "bg-pop-green/10",
    "bg-pop-orange/10",
  ];

  const iconColors = [
    "bg-pop-pink",
    "bg-pop-cyan",
    "bg-pop-green",
    "bg-pop-orange",
  ];

  const accentBorders = [
    "border-pop-pink/30",
    "border-pop-cyan/30",
    "border-pop-green/30",
    "border-pop-orange/30",
  ];

  return (
    <Card
      className={cn(
        "animate-fade-in border-3 transition-all duration-300 rounded-3xl overflow-hidden bg-card/80 backdrop-blur-sm hover-lift",
        popColors[index % popColors.length],
        (course.wgp !== null || course.finalGradePoint !== null) && "pop-shadow"
      )}
    >
      <CardHeader className={cn("pb-3 sm:pb-4", headerColors[index % headerColors.length])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={cn("w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center pop-shadow rotate-3 hover:rotate-0 transition-transform", iconColors[index % iconColors.length])}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-bold font-display">Course {index + 1}</h3>
          </div>
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all duration-200 hover:scale-110 hover:rotate-12"
              aria-label={`Remove course ${index + 1}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 sm:space-y-6 pt-4 px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor={`courseName-${course.id}`} className="font-bold text-sm font-display">Course Name</Label>
            <Input
              id={`courseName-${course.id}`}
              value={course.name}
              onChange={(e) => onUpdate({ ...course, name: e.target.value })}
              placeholder="e.g. Mathematics"
              className="bg-card rounded-2xl border-2 border-foreground/10 h-11 font-medium focus:border-primary transition-all"
            />
            {isCLAD && (
              <p className="text-xs text-muted-foreground bg-pop-yellow/20 px-3 py-1.5 rounded-full inline-block font-medium">
                ✨ CLAD course: Credits = 1
              </p>
            )}
            {!isCLAD && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer group">
                <input
                  id={`hasLab-${course.id}`}
                  type="checkbox"
                  checked={course.hasLab || false}
                  onChange={(e) => handleLabToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-foreground/20 accent-pop-cyan"
                />
                <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                  🔬 This course has Lab
                </span>
              </label>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`credits-${course.id}`} className="font-bold text-sm font-display">Credits</Label>
            <Input
              id={`credits-${course.id}`}
              type="number"
              min={1}
              max={10}
              value={isCLAD ? 1 : course.credits}
              disabled={isCLAD}
              onChange={(e) => onUpdate({ ...course, credits: parseInt(e.target.value) })}
              className="bg-card rounded-2xl border-2 border-foreground/10 h-11 font-medium"
            />
          </div>
        </div>

        {/* Grading Mode Toggle */}
        {!isCLAD && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-display text-muted-foreground">Grading:</span>
            <div className="inline-flex rounded-full border-2 border-foreground/10 overflow-hidden">
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-xs font-bold transition-all duration-200",
                  (course.gradingMode ?? "relative") === "relative"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  if ((course.gradingMode ?? "relative") !== "relative") {
                    onUpdate({
                      ...course,
                      gradingMode: "relative",
                      absoluteMarks: null,
                      absoluteMaxMarks: 100,
                      assessments: createDefaultAssessments(),
                      wgp: null,
                      finalGradePoint: null,
                      letterGrade: null,
                    });
                  }
                }}
              >
                Relative
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-xs font-bold transition-all duration-200",
                  (course.gradingMode ?? "relative") === "absolute"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  if ((course.gradingMode ?? "relative") !== "absolute") {
                    onUpdate({
                      ...course,
                      gradingMode: "absolute",
                      absoluteMarks: null,
                      absoluteMaxMarks: 100,
                      assessments: [],
                      wgp: null,
                      finalGradePoint: null,
                      letterGrade: null,
                    });
                  }
                }}
              >
                Absolute
              </button>
            </div>
          </div>
        )}

        {/* Absolute Grading UI */}
        {!isCLAD && (course.gradingMode ?? "relative") === "absolute" && (
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-foreground/80 font-display">📊 Absolute Grading</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`absMarks-${course.id}`} className="font-bold text-xs font-display">Marks Obtained</Label>
                <Input
                  id={`absMarks-${course.id}`}
                  type="number"
                  min={0}
                  max={course.absoluteMaxMarks ?? 100}
                  placeholder="e.g. 75"
                  value={course.absoluteMarks ?? ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? null : Math.max(0, Number(e.target.value));
                    const maxMarks = course.absoluteMaxMarks ?? 100;
                    const clampedVal = val !== null ? Math.min(val, maxMarks) : null;
                    if (clampedVal !== null && maxMarks > 0) {
                      const result = calculateAbsoluteGrade(clampedVal, maxMarks);
                      let finalGP = result.gradePoint;
                      let letter = result.letterGrade;
                      if (course.hasLab && course.labMarks !== null) {
                        finalGP = calculateFinalGradePointWithLab(result.gradePoint, course.labMarks);
                        const grade = getGradeFromWGP(finalGP);
                        letter = grade.letter;
                      }
                      onUpdate({ ...course, absoluteMarks: clampedVal, wgp: result.gradePoint, finalGradePoint: finalGP, letterGrade: letter });
                    } else {
                      onUpdate({ ...course, absoluteMarks: clampedVal, wgp: null, finalGradePoint: null, letterGrade: null });
                    }
                  }}
                  className="bg-card rounded-2xl border-2 border-foreground/10 h-11 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`absMax-${course.id}`} className="font-bold text-xs font-display">Maximum Marks</Label>
                <Input
                  id={`absMax-${course.id}`}
                  type="number"
                  min={1}
                  max={1000}
                  placeholder="e.g. 100"
                  value={course.absoluteMaxMarks ?? ""}
                  onChange={(e) => {
                    const maxVal = e.target.value === "" ? null : Math.max(1, Number(e.target.value));
                    const obtained = course.absoluteMarks;
                    if (obtained !== null && maxVal !== null && maxVal > 0) {
                      const clamped = Math.min(obtained, maxVal);
                      const result = calculateAbsoluteGrade(clamped, maxVal);
                      let finalGP = result.gradePoint;
                      let letter = result.letterGrade;
                      if (course.hasLab && course.labMarks !== null) {
                        finalGP = calculateFinalGradePointWithLab(result.gradePoint, course.labMarks);
                        const grade = getGradeFromWGP(finalGP);
                        letter = grade.letter;
                      }
                      onUpdate({ ...course, absoluteMaxMarks: maxVal, absoluteMarks: clamped, wgp: result.gradePoint, finalGradePoint: finalGP, letterGrade: letter });
                    } else {
                      onUpdate({ ...course, absoluteMaxMarks: maxVal, wgp: null, finalGradePoint: null, letterGrade: null });
                    }
                  }}
                  className="bg-card rounded-2xl border-2 border-foreground/10 h-11 font-medium"
                />
              </div>
            </div>
            {course.absoluteMarks !== null && course.absoluteMaxMarks !== null && course.absoluteMaxMarks > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl border-2 border-foreground/10">
                <span className="text-sm font-medium">Percentage:</span>
                <span className="text-lg font-bold font-display text-primary">
                  {((course.absoluteMarks / course.absoluteMaxMarks) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}

        {isCLAD && (
          <div className="space-y-2">
            <Label htmlFor={`cladGrade-${course.id}`} className="font-display font-bold">Final Grade</Label>
            <select
              id={`cladGrade-${course.id}`}
              aria-label="Select CLAD grade"
              className="w-full rounded-2xl border-2 border-foreground/10 bg-card px-3 py-2.5 text-center font-bold transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={course.letterGrade ?? ""}
              onChange={(e) => {
                const selected = CLAD_GRADE_OPTIONS.find(g => g.label === e.target.value);
                if (!selected) return;
                onUpdate({
                  ...course,
                  credits: 1,
                  wgp: selected.value,
                  finalGradePoint: selected.value,
                  letterGrade: selected.label,
                  assessments: [],
                  hasLab: false,
                  labMarks: null,
                });
              }}
            >
              <option value="">Select Grade</option>
              {CLAD_GRADE_OPTIONS.map((g) => (
                <option key={g.label} value={g.label}>{g.label}</option>
              ))}
            </select>
          </div>
        )}

        {!isCLAD && (course.gradingMode ?? "relative") === "relative" && (
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-foreground/80 font-display">📝 Assessment Grades</h4>
            
            {/* Desktop: Table layout */}
            <div className="hidden sm:block bg-card rounded-2xl border-2 border-foreground/10 overflow-hidden pop-shadow">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-foreground/10 bg-muted/50">
                    <th className="text-left p-4 text-sm font-bold font-display">Assessment</th>
                    <th className="text-center p-4 text-sm font-bold font-display w-24">Weight</th>
                    <th className="text-center p-4 text-sm font-bold font-display w-40">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {course.assessments.map((assessment, i) => {
                    const gradeOptions = getGradeOptions(assessment.name);
                    const isSessional = assessment.name === 'Sessional 1' || assessment.name === 'Sessional 2';
                    const hasSpecialGrade = SPECIAL_SESSIONAL_GRADES.includes(assessment.gradeLabel || '');
                    const showMarksInput = isSessional && showMarksInputs;
                    
                    return (
                      <tr key={assessment.name} className="border-b border-foreground/5 last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm font-medium">{assessment.name}</td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-bold border border-foreground/10">
                            <Lock className="w-3 h-3" />
                            {(assessment.weight * 100).toFixed(0)}%
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-2">
                            <select
                              id={`grade-${course.id}-${i}`}
                              aria-label={`Select grade for ${assessment.name}`}
                              className="w-full rounded-xl border-2 border-foreground/10 bg-background px-3 py-2 text-center font-bold transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                              value={assessment.gradeLabel ?? ""}
                              onChange={(e) => updateAssessmentGrade(i, e.target.value)}
                            >
                              <option value="">Select</option>
                              {gradeOptions.map((g) => (
                                <option key={g.label} value={g.label}>{g.label}</option>
                              ))}
                            </select>
                            {showMarksInput && (
                              <div className="space-y-1">
                                <Input
                                  id={`marks-${course.id}-${i}`}
                                  aria-label={`Enter marks for ${assessment.name}`}
                                  type="number"
                                  min={0}
                                  max={100}
                                  placeholder="Marks (0-100) *"
                                  value={assessment.marks ?? ""}
                                  onChange={(e) => updateAssessmentMarks(i, e.target.value)}
                                  className={cn(
                                    "w-full text-center bg-background text-sm rounded-xl border-2 font-medium",
                                    assessment.marks === null ? "border-pop-orange" : "border-foreground/10"
                                  )}
                                />
                                {hasSpecialGrade && (
                                  <p className="text-xs text-muted-foreground text-center bg-muted/50 px-2 py-1 rounded-full">
                                    {assessment.gradeLabel}: GP based on total
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: Stacked card layout */}
            <div className="sm:hidden space-y-3">
              {course.assessments.map((assessment, i) => {
                const gradeOptions = getGradeOptions(assessment.name);
                const isSessional = assessment.name === 'Sessional 1' || assessment.name === 'Sessional 2';
                const hasSpecialGrade = SPECIAL_SESSIONAL_GRADES.includes(assessment.gradeLabel || '');
                const showMarksInput = isSessional && showMarksInputs;
                
                return (
                  <div 
                    key={assessment.name} 
                    className={cn(
                      "bg-card rounded-2xl border-2 p-4 space-y-3 transition-all duration-200",
                      accentBorders[index % accentBorders.length],
                      "hover:pop-shadow"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-display">{assessment.name}</span>
                      <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-bold border border-foreground/10">
                        <Lock className="w-3 h-3" />
                        {(assessment.weight * 100).toFixed(0)}%
                      </div>
                    </div>
                    <select
                      id={`grade-mobile-${course.id}-${i}`}
                      aria-label={`Select grade for ${assessment.name}`}
                      className="w-full rounded-xl border-2 border-foreground/10 bg-background px-3 py-2.5 text-center font-bold text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={assessment.gradeLabel ?? ""}
                      onChange={(e) => updateAssessmentGrade(i, e.target.value)}
                    >
                      <option value="">Select Grade</option>
                      {gradeOptions.map((g) => (
                        <option key={g.label} value={g.label}>{g.label}</option>
                      ))}
                    </select>
                    {showMarksInput && (
                      <div className="space-y-1.5">
                        <Input
                          id={`marks-mobile-${course.id}-${i}`}
                          aria-label={`Enter marks for ${assessment.name}`}
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Enter marks (0-100) *"
                          value={assessment.marks ?? ""}
                          onChange={(e) => updateAssessmentMarks(i, e.target.value)}
                          className={cn(
                            "w-full text-center bg-background text-sm rounded-xl border-2 font-medium",
                            assessment.marks === null ? "border-pop-orange" : "border-foreground/10"
                          )}
                        />
                        {hasSpecialGrade && (
                          <p className="text-xs text-muted-foreground text-center bg-muted/50 px-2 py-1 rounded-full">
                            {assessment.gradeLabel}: GP based on total
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {showMarksInputs && (
              <div className={cn(
                "text-sm p-4 rounded-2xl border-2",
                !bothEntered ? "bg-pop-orange/10 border-pop-orange/30 text-pop-orange" :
                totalMarks >= 25 ? "bg-pop-green/10 border-pop-green/30 text-pop-green" :
                "bg-destructive/10 border-destructive/30 text-destructive"
              )}>
                <div className="font-bold mb-2 font-display">📊 Sessional Marks Summary:</div>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs font-medium">
                  <span className="bg-card px-3 py-1 rounded-full border border-foreground/10">S1: {s1Marks !== null ? s1Marks : '—'}</span>
                  <span className="bg-card px-3 py-1 rounded-full border border-foreground/10">S2: {s2Marks !== null ? s2Marks : '—'}</span>
                  <span className="font-bold bg-card px-3 py-1 rounded-full border border-foreground/10">Total: {bothEntered ? totalMarks : '—'}</span>
                </div>
                {!bothEntered && <p className="text-xs mt-2 font-medium">⚠️ Enter marks for both sessionals to calculate grades</p>}
                {bothEntered && totalMarks >= 25 && <p className="text-xs mt-2 font-medium">✅ Total ≥ 25: I grade gets GP 4, Ab/R gets GP 0</p>}
                {bothEntered && totalMarks < 25 && <p className="text-xs mt-2 font-medium">⚠️ Total &lt; 25: I grade gets GP 0 → Final Grade: F (if I selected)</p>}
              </div>
            )}
            
            {course.letterGrade === 'F' && !showMarksInputs && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-2xl border-2 border-destructive/30 font-medium">
                {checkForFGrade(course.assessments).reason === 'Learning Engagement is L/AB' && (
                  <span>⚠️ Learning Engagement is L/AB - Grade: F</span>
                )}
              </div>
            )}
          </div>
        )}

        {!isCLAD && course.hasLab && (
          <div className="space-y-2">
            <Label htmlFor={`labMarks-${course.id}`} className="font-bold font-display">🔬 Lab Marks (out of 100)</Label>
            <Input
              id={`labMarks-${course.id}`}
              type="number"
              min={0}
              max={100}
              placeholder="Enter lab marks"
              value={course.labMarks ?? ""}
              onChange={(e) => {
                const labMarks = e.target.value === "" ? null : Math.min(100, Math.max(0, Number(e.target.value)));
                if (course.wgp !== null && labMarks !== null) {
                  const finalGP = calculateFinalGradePointWithLab(course.wgp, labMarks);
                  const grade = getGradeFromWGP(finalGP);
                  onUpdate({ ...course, labMarks, finalGradePoint: finalGP, letterGrade: grade.letter });
                } else {
                  onUpdate({ ...course, labMarks });
                }
              }}
              className="bg-card rounded-2xl border-2 border-foreground/10 h-11 font-medium"
            />
          </div>
        )}

        {(course.wgp !== null || course.finalGradePoint !== null) && (
          <div className="animate-bounce-in space-y-4">
            {!isCLAD && course.wgp !== null && (course.gradingMode ?? "relative") === "relative" && course.assessments.length > 0 && (
              <WGPFormula
                assessments={course.assessments}
                wgp={course.wgp}
                hasLab={course.hasLab}
                labMarks={course.labMarks}
                finalGradePoint={course.finalGradePoint}
              />
            )}
            {course.finalGradePoint !== null && course.letterGrade && (
              <div className="flex items-center justify-center gap-4 p-5 bg-gradient-to-br from-pop-purple/10 to-pop-pink/10 rounded-2xl border-2 border-pop-purple/30 pop-shadow">
                <GradeBadge letter={course.letterGrade} point={course.finalGradePoint} />
                <div className="text-sm text-muted-foreground font-medium">
                  <span className="font-display font-bold text-foreground text-lg block">{course.finalGradePoint}</span>
                  Final Grade Point
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
