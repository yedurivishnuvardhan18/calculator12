import { lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Course, createNewCourse, calculateSGPA } from "@/types/calculator";
import { CourseCard } from "@/components/calculator/CourseCard";
import { StepIndicator } from "@/components/calculator/StepIndicator";
import { SGPASection } from "@/components/calculator/SGPASection";
import { CGPASection } from "@/components/calculator/CGPASection";
import { GradeChart } from "@/components/calculator/GradeChart";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, RotateCcw } from "lucide-react";
import { usePersistedGrades } from "@/hooks/use-persisted-grades";
import { MAX_COURSES } from "@/lib/security";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";

const InteractiveCharts = lazy(() =>
  import("@/components/calculator/InteractiveCharts").then((module) => ({
    default: module.InteractiveCharts,
  }))
);

export default function GradeCalculator() {
  const { courses, setCourses, showCGPA, setShowCGPA, cgpaData, setCGPAData } = usePersistedGrades();

  const addCourse = () => {
    if (courses.length >= MAX_COURSES) {
      toast.error(`Maximum ${MAX_COURSES} courses allowed`);
      return;
    }
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
      <Seo
        title="GITAM CGPA Calculator | SGPA & Grade Calculator | TeamDino"
        description="Calculate GITAM CGPA, SGPA, GPA, and semester grades with the free GITAM grade calculator. Ideal for GITAM students checking academic performance, grade points, and CGPA conversion."
        isHomePage
      />
      <div className="container max-w-4xl py-5 sm:py-10 px-4 sm:px-6 space-y-5 sm:space-y-8">
        {/* Header */}
        <motion.div
          className="space-y-3 py-2 text-center sm:py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">GITAM Grade Calculator</h1>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
            Calculate WGP, SGPA, and CGPA with a clear step-by-step breakdown.
          </p>
        </motion.div>

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
              className="rounded-xl border-primary/30 font-medium text-primary hover:bg-primary hover:text-primary-foreground"
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

        {/* Interactive Charts */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Suspense fallback={<div className="h-[220px] rounded-xl skeleton-shimmer" aria-busy="true" />}>
            <InteractiveCharts courses={courses} />
          </Suspense>
        </motion.div>

        {/* SEO Content Section */}
        <section style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h2>GITAM CGPA Calculator & GITAM Grade Calculator</h2>
          <p>
            Use this free GITAM grade calculator to work out semester results from
            course grades and credits. It is designed for GITAM students who need a
            quick GITAM CGPA calculator, SGPA calculator, and GPA calculator for academic tracking.
          </p>

          <h2>What can you calculate with the GITAM SGPA calculator?</h2>
          <p>
            Calculate WGP and SGPA for a semester, then continue to CGPA using your
            previous result and credits. This GITAM CGPA calculator, SGPA calculator,
            and GPA calculator are built to help you estimate performance without any sign-up.
          </p>

          <h2>How to calculate CGPA and semester grade at GITAM?</h2>
          <p>
            Enter your subject credits and grades in the calculator above. Our tool
            automatically applies the GITAM grading formula and gives you CGPA, SGPA,
            and grade breakdowns instantly for quick academic planning.
          </p>

          <h2>Why students choose TeamDino's GITAM calculator</h2>
          <p>
            Students use the TeamDino grade calculator to track semester scores,
            convert credits into grade points, and compare academic performance across
            subjects. It works as a practical GITAM grade calculator for SGPA, CGPA,
            and student grade evaluation across the semester.
          </p>
          <p>
            <Link to="/about" className="font-semibold text-primary underline underline-offset-4">
              Learn about TeamDino and its administrator, Yeduri Vishnuvardhan.
            </Link>
          </p>
        </section>

      </div>
    </div>
  );
}
