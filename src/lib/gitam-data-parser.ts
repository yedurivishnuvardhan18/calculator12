import { z } from "zod";

// Schemas for validation
const gradeItemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  credits: z.number().min(0).default(0),
  internal: z.string().default(""),
  external: z.string().default(""),
  grade: z.string().default(""),
  gradePoint: z.number().nullable().default(null),
});

const attendanceItemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  present: z.number().min(0),
  total: z.number().min(0),
  percentage: z.number().min(0).max(100).default(0),
});

const gradesPayloadSchema = z.object({
  type: z.literal("gitam-grades"),
  version: z.number(),
  semester: z.string().default("Unknown"),
  extractedAt: z.string(),
  data: z.array(gradeItemSchema).min(1),
});

const attendancePayloadSchema = z.object({
  type: z.literal("gitam-attendance"),
  version: z.number(),
  extractedAt: z.string(),
  data: z.array(attendanceItemSchema).min(1),
});

export type GradeItem = z.infer<typeof gradeItemSchema>;
export type AttendanceItem = z.infer<typeof attendanceItemSchema>;
export type GradesPayload = z.infer<typeof gradesPayloadSchema>;
export type AttendancePayload = z.infer<typeof attendancePayloadSchema>;

export interface ImportedData {
  grades: GradesPayload | null;
  attendance: AttendancePayload | null;
}

const STORAGE_KEY = "gitam_imported_data";

export function parseGradesJSON(raw: string): { success: true; data: GradesPayload } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    const result = gradesPayloadSchema.safeParse(parsed);
    if (!result.success) return { success: false, error: "Invalid grades format: " + result.error.issues.map(i => i.message).join(", ") };
    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Invalid JSON. Make sure you copied the full output from the bookmarklet." };
  }
}

export function parseAttendanceJSON(raw: string): { success: true; data: AttendancePayload } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    const result = attendancePayloadSchema.safeParse(parsed);
    if (!result.success) return { success: false, error: "Invalid attendance format: " + result.error.issues.map(i => i.message).join(", ") };
    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Invalid JSON. Make sure you copied the full output from the bookmarklet." };
  }
}

export function autoDetectAndParse(raw: string): { type: "grades"; data: GradesPayload } | { type: "attendance"; data: AttendancePayload } | { type: "error"; error: string } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.type === "gitam-grades") {
      const r = gradesPayloadSchema.safeParse(parsed);
      if (r.success) return { type: "grades", data: r.data };
      return { type: "error", error: "Invalid grades data structure." };
    }
    if (parsed.type === "gitam-attendance") {
      const r = attendancePayloadSchema.safeParse(parsed);
      if (r.success) return { type: "attendance", data: r.data };
      return { type: "error", error: "Invalid attendance data structure." };
    }
    return { type: "error", error: "Unrecognized data type. Use the bookmarklet to extract data." };
  } catch {
    return { type: "error", error: "Invalid JSON format." };
  }
}

export function saveImportedData(data: Partial<ImportedData>): void {
  try {
    const existing = loadImportedData();
    const merged = { ...existing, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch { /* storage full */ }
}

export function loadImportedData(): ImportedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { grades: null, attendance: null };
    return JSON.parse(raw);
  } catch {
    return { grades: null, attendance: null };
  }
}

export function clearImportedData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function calculateSGPA(grades: GradeItem[]): number | null {
  let totalCredits = 0;
  let totalPoints = 0;
  for (const g of grades) {
    if (g.gradePoint !== null && g.credits > 0) {
      totalCredits += g.credits;
      totalPoints += g.credits * g.gradePoint;
    }
  }
  if (totalCredits === 0) return null;
  return totalPoints / totalCredits;
}
