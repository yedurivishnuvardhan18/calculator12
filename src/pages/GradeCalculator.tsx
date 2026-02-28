import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Course, createNewCourse, calculateSGPA } from "@/types/calculator";
import { CourseCard } from "@/components/calculator/CourseCard";
import { StepIndicator } from "@/components/calculator/StepIndicator";
import { SGPASection } from "@/components/calculator/SGPASection";
import { CGPASection } from "@/components/calculator/CGPASection";
import { RollNumberSave } from "@/components/calculator/RollNumberSave";
import { GradeChart } from "@/components/calculator/GradeChart";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, Sparkles, RotateCcw } from "lucide-react";
import { usePersistedGrades } from "@/hooks/use-persisted-grades";

export default function GradeCalculator() {
  const { courses, setCourses, showCGPA, setShowCGPA, cgpaData, setCGPAData } = usePersistedGrades();

  const addCourse = () => {
    setCourses((prev) => [...prev, createNewCourse()]);
  };

  const resetAll = () => {
    setCourses([createNewCourse()]);
    setShowCGPA(false);
    setCGPAData(null);
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

  const handleLoadSaved = useCallback(
    (data: { courses: Course[]; showCGPA: boolean; cgpaData: typeof cgpaData }) => {
      setCourses(data.courses);
      setShowCGPA(data.showCGPA);
      setCGPAData(data.cgpaData);
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
        {/* Header with Save/Load */}
        <div className="flex items-start justify-between gap-3">
          <motion.div
            className="text-center flex-1 space-y-3"
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-pop-pink/20 via-pop-purple/15 to-pop-cyan/20 px-5 sm:px-6 py-3 rounded-full border-3 border-pop-pink/30 pop-shadow-lg">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-pop-pink animate-float" />
              <h1 className="text-xl sm:text-3xl font-black font-display">Grade Calculator</h1>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pop-yellow" />
            </div>
            <p className="text-muted-foreground text-xs sm:text-base font-medium max-w-lg mx-auto">
              Calculate your WGP, SGPA, and CGPA with step-by-step breakdowns ✨
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RollNumberSave
              courses={courses}
              showCGPA={showCGPA}
              cgpaData={cgpaData}
              onLoad={handleLoadSaved}
            />
          </motion.div>
        </div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
        </motion.div>

        {/* Grade Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <GradeChart />
        </motion.div>

        {/* Course Cards */}
        <div className="space-y-5 sm:space-y-6">
          <AnimatePresence mode="popLayout">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: -80 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <CourseCard
                  course={course}
                  index={index}
                  onUpdate={(updated) => updateCourse(index, updated)}
                  onRemove={() => removeCourse(index)}
                  canRemove={courses.length > 1}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Course Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <motion.div whileHover={{ scale: 1.05, rotate: 1 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={addCourse}
              variant="outline"
              size="lg"
              className="rounded-full border-3 border-dashed border-pop-cyan font-bold font-display text-pop-cyan hover:bg-pop-cyan hover:text-white transition-all duration-300 hover:border-solid hover:pop-shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Course
            </Button>
          </motion.div>
          {courses.length > 1 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-2">
              <Button
                onClick={resetAll}
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-destructive font-bold text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset All Courses
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* SGPA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <SGPASection
            courses={courses}
            onShowCGPA={() => setShowCGPA(true)}
            cgpaData={cgpaData ?? undefined}
          />
        </motion.div>

        {/* CGPA Section */}
        <AnimatePresence>
          {showCGPA && sgpaResult && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 40 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
            >
              <CGPASection
                currentSGPA={sgpaResult.sgpa}
                currentCredits={sgpaResult.totalCredits}
                courses={courses}
                onCGPACalculated={handleCGPACalculated}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          className="text-center py-4 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-muted-foreground font-medium">
            Made with 💜 by TeamDino
          </p>
        </motion.div>
      </div>
    </div>
  );
}
