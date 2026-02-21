// Types
export interface Assessment {
  name: string;
  weight: number;
  gradePoint: number | null;
  gradeLabel: string | null;
  marks: number | null;
}

export interface Course {
  id: string;
  name: string;
  credits: number;
  assessments: Assessment[];
  wgp: number | null;
  finalGradePoint: number | null;
  letterGrade: string | null;
  hasLab: boolean;
  labMarks: number | null;
  gradingMode: "relative" | "absolute";
  absoluteMarks: number | null;
  absoluteMaxMarks: number | null;
}

// Grade mappings (10-point scale)
export const GRADE_MAPPINGS = [
  { letter: "O", min: 9.5, max: 10, color: "grade-o" },
  { letter: "A+", min: 8.5, max: 9.49, color: "grade-a-plus" },
  { letter: "A", min: 7.5, max: 8.49, color: "grade-a" },
  { letter: "B+", min: 6.5, max: 7.49, color: "grade-b-plus" },
  { letter: "B", min: 5.5, max: 6.49, color: "grade-b" },
  { letter: "C", min: 4.5, max: 5.49, color: "grade-c" },
  { letter: "P", min: 4.0, max: 4.49, color: "grade-p" },
  { letter: "F", min: 0, max: 3.99, color: "grade-f" },
];

// Special sessional grades that require marks input
export const SPECIAL_SESSIONAL_GRADES = ["I", "P", "Ab/R"];

// Calculate WGP from assessments using weights: S1=0.30, S2=0.45, LE=0.25
export function calculateWGP(assessments: Assessment[]): number | null {
  if (assessments.length === 0) return null;
  if (assessments.some((a) => a.gradePoint === null)) return null;

  return assessments.reduce((sum, a) => sum + a.gradePoint! * a.weight, 0);
}

// Get letter grade from WGP value
export function getGradeFromWGP(wgp: number): { letter: string; min: number; max: number; color: string } {
  for (const grade of GRADE_MAPPINGS) {
    if (wgp >= grade.min) return grade;
  }
  return GRADE_MAPPINGS[GRADE_MAPPINGS.length - 1];
}

// Calculate final grade point when course has lab component
// Theory 70%, Lab 30%
export function calculateFinalGradePointWithLab(wgp: number, labMarks: number): number {
  const theoryPercentage = (wgp / 10) * 100 * 0.7;
  const labPercentage = labMarks * 0.3;
  const finalPercentage = theoryPercentage + labPercentage;
  const finalGP = Math.min(10, Math.ceil(finalPercentage / 10));
  return finalGP;
}

// Calculate SGPA from valid courses
export function calculateSGPA(courses: Course[]): { sgpa: number; totalCredits: number; totalGradePoints: number } | null {
  if (courses.length === 0) return null;

  let totalCredits = 0;
  let totalGradePoints = 0;

  for (const course of courses) {
    if (course.finalGradePoint === null) continue;
    totalCredits += course.credits;
    totalGradePoints += course.credits * course.finalGradePoint;
  }

  if (totalCredits === 0) return null;

  return {
    sgpa: totalGradePoints / totalCredits,
    totalCredits,
    totalGradePoints,
  };
}

// Calculate CGPA combining current semester with previous
export function calculateCGPA(
  currentSGPA: number,
  currentCredits: number,
  previousCGPA: number,
  previousCredits: number
): { cgpa: number; totalCredits: number; totalGradePoints: number } {
  const previousGradePoints = previousCGPA * previousCredits;
  const currentGradePoints = currentSGPA * currentCredits;
  const totalGradePoints = previousGradePoints + currentGradePoints;
  const totalCredits = previousCredits + currentCredits;

  return {
    cgpa: totalGradePoints / totalCredits,
    totalCredits,
    totalGradePoints,
  };
}

// Check if a course should get F grade (e.g., L/AB in Learning Engagement)
export function checkForFGrade(assessments: Assessment[]): { isF: boolean; reason: string } {
  const le = assessments.find((a) => a.name === "Learning Engagement");
  if (le && le.gradeLabel === "L/AB") {
    return { isF: true, reason: "Learning Engagement is L/AB" };
  }
  
  // Check if I grade with total < 25
  const s1 = assessments.find((a) => a.name === "Sessional 1");
  const s2 = assessments.find((a) => a.name === "Sessional 2");
  
  if (
    (s1?.gradeLabel === "I" || s2?.gradeLabel === "I") &&
    s1?.marks !== null && s2?.marks !== null
  ) {
    const total = (s1.marks ?? 0) + (s2.marks ?? 0);
    if (total < 25) {
      return { isF: true, reason: "Sessional total < 25 with I grade" };
    }
  }

  return { isF: false, reason: "" };
}

// Check if marks input is required for a grade label
export function requiresMarksInput(gradeLabel: string | null): boolean {
  if (!gradeLabel) return false;
  return ["I", "Ab/R"].includes(gradeLabel);
}

// Get total sessional marks
export function getSessionalTotalMarks(assessments: Assessment[]): {
  total: number;
  s1Marks: number | null;
  s2Marks: number | null;
  bothEntered: boolean;
} {
  const s1 = assessments.find((a) => a.name === "Sessional 1");
  const s2 = assessments.find((a) => a.name === "Sessional 2");
  const s1Marks = s1?.marks ?? null;
  const s2Marks = s2?.marks ?? null;
  const bothEntered = s1Marks !== null && s2Marks !== null;
  const total = (s1Marks ?? 0) + (s2Marks ?? 0);

  return { total, s1Marks, s2Marks, bothEntered };
}

// Get grade point for sessional based on grade label and total marks
export function getSessionalGradePoint(gradeLabel: string | null | undefined, totalMarks: number): number {
  if (!gradeLabel) return 0;
  
  if (gradeLabel === "Ab/R") return 0;
  
  if (gradeLabel === "I") {
    return totalMarks >= 25 ? 4 : 0;
  }
  
  if (gradeLabel === "P") return 4;
  
  return 0;
}

// Create default assessments for a new course
export function createDefaultAssessments(): Assessment[] {
  return [
    { name: "Sessional 1", weight: 0.30, gradePoint: null, gradeLabel: null, marks: null },
    { name: "Sessional 2", weight: 0.45, gradePoint: null, gradeLabel: null, marks: null },
    { name: "Learning Engagement", weight: 0.25, gradePoint: null, gradeLabel: null, marks: null },
  ];
}

// Create a new empty course
export function createNewCourse(): Course {
  return {
    id: crypto.randomUUID(),
    name: "",
    credits: 3,
    assessments: createDefaultAssessments(),
    wgp: null,
    finalGradePoint: null,
    letterGrade: null,
    hasLab: false,
    labMarks: null,
    gradingMode: "relative",
    absoluteMarks: null,
    absoluteMaxMarks: 100,
  };
}

// Calculate grade from absolute marks (percentage-based)
export function calculateAbsoluteGrade(obtained: number, max: number): { gradePoint: number; letterGrade: string; percentage: number } {
  const percentage = (obtained / max) * 100;
  if (percentage >= 90) return { gradePoint: 10, letterGrade: "O", percentage };
  if (percentage >= 80) return { gradePoint: 9, letterGrade: "A+", percentage };
  if (percentage >= 70) return { gradePoint: 8, letterGrade: "A", percentage };
  if (percentage >= 60) return { gradePoint: 7, letterGrade: "B+", percentage };
  if (percentage >= 50) return { gradePoint: 6, letterGrade: "B", percentage };
  if (percentage >= 40) return { gradePoint: 4, letterGrade: "P", percentage };
  return { gradePoint: 0, letterGrade: "F", percentage };
}
