import { useState, useEffect, useRef, useCallback } from "react";
import { Course, createNewCourse } from "@/types/calculator";

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

function loadState(): Omit<PersistedState, "savedAt"> {
  const defaults = { courses: [createNewCourse()], showCGPA: false, cgpaData: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: PersistedState = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return defaults;
    }
    return { courses: parsed.courses, showCGPA: parsed.showCGPA, cgpaData: parsed.cgpaData };
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
