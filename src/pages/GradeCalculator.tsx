import { useCallback } from "react";
import { Course, createNewCourse, calculateSGPA } from "@/types/calculator";
import { CourseCard } from "@/components/calculator/CourseCard";
import { StepIndicator } from "@/components/calculator/StepIndicator";
import { SGPASection } from "@/components/calculator/SGPASection";
import { CGPASection } from "@/components/calculator/CGPASection";
import { GradeChart } from "@/components/calculator/GradeChart";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, Sparkles } from "lucide-react";
import { usePersistedGrades } from "@/hooks/use-persisted-grades";

export default function GradeCalculator() {
  const { courses, setCourses, showCGPA, setShowCGPA, cgpaData, setCGPAData } = usePersistedGrades();

  const addCourse = () => {
    setCourses((prev) => [...prev, createNewCourse()]);
  };

  const removeCourse = (index: number) => {
    setCourses((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCourse = (index: number, updated: Course) => {
    setCourses((prev) => prev.map((c, i) => (i === index ? updated : c)));
  };

  const handleCGPACalculated = useCallback(
    (data: { cgpa: number; previousCGPA: number; previousCredits: number; newTotalCredits: number } | null) => {
      setCGPAData(data);
    },
    []
  );

  // Determine current step
  const validCourses = courses.filter((c) => c.finalGradePoint !== null && c.name.trim() !== "");
  const hasAnyCourseWGP = courses.some((c) => c.wgp !== null);
  const hasAnyLetterGrade = courses.some((c) => c.letterGrade !== null);
  const sgpaResult = calculateSGPA(validCourses);

  let currentStep = 1;
  const completedSteps: number[] = [];

  if (hasAnyCourseWGP) {
    completedSteps.push(1);
    currentStep = 2;
  }
  if (hasAnyLetterGrade) {
    completedSteps.push(2);
    currentStep = 3;
  }
  if (sgpaResult) {
    currentStep = 3;
  }
  if (showCGPA) {
    currentStep = 4;
  }
  if (cgpaData) {
    completedSteps.push(3, 4);
  }

  return (
    <div className="min-h-screen bg-background abstract-dots">
      <div className="container max-w-4xl py-5 sm:py-10 px-4 sm:px-6 space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 animate-pop-in">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-pop-pink/20 via-pop-purple/15 to-pop-cyan/20 px-5 sm:px-6 py-3 rounded-full border-3 border-pop-pink/30 pop-shadow-lg">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-pop-pink animate-float" />
            <h1 className="text-xl sm:text-3xl font-black font-display">Grade Calculator</h1>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pop-yellow" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-base font-medium max-w-lg mx-auto">
            Calculate your WGP, SGPA, and CGPA with step-by-step breakdowns ✨
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

        {/* Grade Chart */}
        <GradeChart />

        {/* Course Cards */}
        <div className="space-y-5 sm:space-y-6">
          {courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
              onUpdate={(updated) => updateCourse(index, updated)}
              onRemove={() => removeCourse(index)}
              canRemove={courses.length > 1}
            />
          ))}
        </div>

        {/* Add Course Button */}
        <div className="text-center">
          <Button
            onClick={addCourse}
            variant="outline"
            size="lg"
            className="rounded-full border-3 border-dashed border-pop-cyan font-bold font-display text-pop-cyan hover:bg-pop-cyan hover:text-white transition-all duration-300 hover:scale-105 hover:border-solid hover:pop-shadow hover:rotate-1 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Another Course
          </Button>
        </div>

        {/* SGPA Section */}
        <SGPASection
          courses={courses}
          onShowCGPA={() => setShowCGPA(true)}
          cgpaData={cgpaData ?? undefined}
        />

        {/* CGPA Section */}
        {showCGPA && sgpaResult && (
          <CGPASection
            currentSGPA={sgpaResult.sgpa}
            currentCredits={sgpaResult.totalCredits}
            courses={courses}
            onCGPACalculated={handleCGPACalculated}
          />
        )}

        {/* Footer */}
        <div className="text-center py-4 sm:py-6">
          <p className="text-xs text-muted-foreground font-medium">
            Made with 💜 by TeamDino
          </p>
        </div>
      </div>
    </div>
  );
}
