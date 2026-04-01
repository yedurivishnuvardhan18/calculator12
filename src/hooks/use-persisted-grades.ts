import { useState, useEffect, useRef } from "react";
import { Course, createNewCourse } from "@/types/calculator";
import { safeParseJSON, ensureFinite, ensureBoolean, ensureString, clampNumber } from "@/lib/security";

const STORAGE_KEY = "grade_calculator_state";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PersistedState {
  courses: Course[];
  showCGPA: boolean;
  cgpaData: {
    cgpa: number;
    previousCGPA: number;
    previousCredits: number;
    newTotalCredits: number;
  } | null;
  savedAt: number;
}

function sanitizeCourse(c: unknown): Course | null {
  if (!c || typeof c !== "object") return null;
  const obj = c as Record<string, unknown>;
  try {
    return {
      id: typeof obj.id === "string" ? obj.id : crypto.randomUUID(),
      name: ensureString(obj.name, "", 100),
      credits: clampNumber(ensureFinite(obj.credits, 0), 0, 10),
      assessments: Array.isArray(obj.assessments) ? obj.assessments.map((a: unknown) => {
        if (!a || typeof a !== "object") return { name: "", weight: 0, gradePoint: null, gradeLabel: null, marks: null };
        const ao = a as Record<string, unknown>;
        return {
          name: ensureString(ao.name, ""),
          weight: clampNumber(ensureFinite(ao.weight, 0), 0, 1),
          gradePoint: ao.gradePoint === null ? null : clampNumber(ensureFinite(ao.gradePoint, 0), 0, 10),
          gradeLabel: typeof ao.gradeLabel === "string" ? ao.gradeLabel : null,
          marks: ao.marks === null ? null : clampNumber(ensureFinite(ao.marks, 0), 0, 100),
        };
      }) : [],
      wgp: obj.wgp === null ? null : clampNumber(ensureFinite(obj.wgp, 0), 0, 10),
      finalGradePoint: obj.finalGradePoint === null ? null : clampNumber(ensureFinite(obj.finalGradePoint, 0), 0, 10),
      letterGrade: typeof obj.letterGrade === "string" ? obj.letterGrade : null,
      hasLab: ensureBoolean(obj.hasLab, false),
      labMarks: obj.labMarks === null ? null : clampNumber(ensureFinite(obj.labMarks, 0), 0, 100),
      gradingMode: obj.gradingMode === "absolute" ? "absolute" : "relative",
      absoluteMarks: obj.absoluteMarks === null ? null : clampNumber(ensureFinite(obj.absoluteMarks, 0), 0, 1000),
      absoluteMaxMarks: obj.absoluteMaxMarks === null ? null : clampNumber(ensureFinite(obj.absoluteMaxMarks, 100), 1, 1000),
    };
  } catch {
    return null;
  }
}

function sanitizeCgpaData(data: unknown): PersistedState["cgpaData"] {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  return {
    cgpa: clampNumber(ensureFinite(obj.cgpa, 0), 0, 10),
    previousCGPA: clampNumber(ensureFinite(obj.previousCGPA, 0), 0, 10),
    previousCredits: clampNumber(ensureFinite(obj.previousCredits, 0), 0, 9999),
    newTotalCredits: clampNumber(ensureFinite(obj.newTotalCredits, 0), 0, 9999),
  };
}

function loadState(): Omit<PersistedState, "savedAt"> {
  const defaults = { courses: [createNewCourse()], showCGPA: false, cgpaData: null };
  try {
    const parsed = safeParseJSON<PersistedState>(localStorage.getItem(STORAGE_KEY));
    if (!parsed) return defaults;
    if (Date.now() - (parsed.savedAt ?? 0) > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return defaults;
    }
    const courses = Array.isArray(parsed.courses)
      ? parsed.courses.map(sanitizeCourse).filter((c): c is Course => c !== null)
      : [];
    if (courses.length === 0) return defaults;
    return {
      courses,
      showCGPA: ensureBoolean(parsed.showCGPA, false),
      cgpaData: sanitizeCgpaData(parsed.cgpaData),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return defaults;
  }
}

export function usePersistedGrades() {
  const initial = useRef(loadState());
  const [courses, setCourses] = useState<Course[]>(initial.current.courses);
  const [showCGPA, setShowCGPA] = useState(initial.current.showCGPA);
  const [cgpaData, setCGPAData] = useState(initial.current.cgpaData);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Save whenever state changes (debounced)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const state: PersistedState = { courses, showCGPA, cgpaData, savedAt: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch { /* storage full or unavailable */ }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [courses, showCGPA, cgpaData]);

  return { courses, setCourses, showCGPA, setShowCGPA, cgpaData, setCGPAData };
}
