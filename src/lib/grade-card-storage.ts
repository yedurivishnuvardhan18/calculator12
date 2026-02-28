import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/types/calculator";

// ── Types ──────────────────────────────────────────────────────────────────

export interface GradeCardPayload {
  courses: Course[];
  showCGPA: boolean;
  cgpaData: {
    cgpa: number;
    previousCGPA: number;
    previousCredits: number;
    newTotalCredits: number;
  } | null;
}

type ErrorCategory = "network" | "timeout" | "validation" | "backend";

interface DiagnosticInfo {
  operation: "save" | "load";
  roll: string;
  category: ErrorCategory;
  retryCount: number;
  online: boolean;
  rawMessage: string;
}

export interface StorageResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
  localFallback?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────

const LOCAL_BACKUP_PREFIX = "grade_card_backup_";
const TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

// ── Validation ─────────────────────────────────────────────────────────────

export function normalizeRoll(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidRoll(roll: string): boolean {
  return /^[A-Z0-9]{5,20}$/.test(roll);
}

// ── Error classification ───────────────────────────────────────────────────

function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("aborted") ||
    msg.includes("timeout") ||
    msg.includes("network request failed")
  );
}

function classifyError(err: unknown): ErrorCategory {
  if (!(err instanceof Error)) return "backend";
  const msg = err.message.toLowerCase();
  if (msg.includes("timeout")) return "timeout";
  if (isTransientError(err)) return "network";
  return "backend";
}

function friendlyMessage(category: ErrorCategory): string {
  switch (category) {
    case "network":
      return "Couldn't reach the server. Check your connection and try again.";
    case "timeout":
      return "Request timed out. Please try again.";
    case "backend":
      return "Something went wrong on our end. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

function logDiagnostic(info: DiagnosticInfo) {
  console.warn("[GradeCardStorage]", JSON.stringify(info));
}

// ── Retry helper with timeout ──────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, operation: "save" | "load", roll: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const result = await fn();
        clearTimeout(timer);
        return result;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || attempt === MAX_RETRIES) {
        const category = classifyError(err);
        logDiagnostic({
          operation,
          roll,
          category,
          retryCount: attempt,
          online: typeof navigator !== "undefined" ? navigator.onLine : true,
          rawMessage: err instanceof Error ? err.message : String(err),
        });
        break;
      }
      // wait before retry
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError;
}

// ── Local backup helpers ───────────────────────────────────────────────────

function localKey(roll: string): string {
  return LOCAL_BACKUP_PREFIX + roll;
}

function saveLocalBackup(roll: string, payload: GradeCardPayload) {
  try {
    localStorage.setItem(localKey(roll), JSON.stringify({ ...payload, savedAt: Date.now() }));
  } catch { /* storage full */ }
}

function loadLocalBackup(roll: string): GradeCardPayload | null {
  try {
    const raw = localStorage.getItem(localKey(roll));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { courses: parsed.courses, showCGPA: parsed.showCGPA, cgpaData: parsed.cgpaData };
  } catch {
    return null;
  }
}

function clearLocalBackup(roll: string) {
  try {
    localStorage.removeItem(localKey(roll));
  } catch { /* noop */ }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function saveGradeCard(roll: string, payload: GradeCardPayload): Promise<StorageResult> {
  if (!isValidRoll(roll)) {
    return { ok: false, error: "Invalid roll number (5-20 alphanumeric characters required)." };
  }

  try {
    await withRetry(async () => {
      const { error } = await supabase
        .from("saved_grade_cards")
        .upsert(
          {
            roll_number: roll,
            courses: JSON.parse(JSON.stringify(payload.courses)),
            show_cgpa: payload.showCGPA,
            cgpa_data: payload.cgpaData ? JSON.parse(JSON.stringify(payload.cgpaData)) : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "roll_number" }
        );
      if (error) throw new Error(error.message);
    }, "save", roll);

    // Success – clear any local backup for this roll
    clearLocalBackup(roll);
    return { ok: true };
  } catch (err) {
    // Cloud failed → save locally as fallback
    saveLocalBackup(roll, payload);
    const category = classifyError(err);
    return {
      ok: false,
      error: friendlyMessage(category),
      localFallback: true,
    };
  }
}

export async function loadGradeCard(roll: string): Promise<StorageResult<GradeCardPayload>> {
  if (!isValidRoll(roll)) {
    return { ok: false, error: "Invalid roll number." };
  }

  try {
    const data = await withRetry(async () => {
      const { data, error } = await supabase
        .from("saved_grade_cards")
        .select("*")
        .eq("roll_number", roll)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    }, "load", roll);

    if (!data) {
      // Check local backup
      const local = loadLocalBackup(roll);
      if (local) {
        return { ok: true, data: local, localFallback: true };
      }
      return { ok: false, error: `No saved grade card found for ${roll}.` };
    }

    return {
      ok: true,
      data: {
        courses: data.courses as unknown as Course[],
        showCGPA: data.show_cgpa,
        cgpaData: data.cgpa_data as unknown as GradeCardPayload["cgpaData"],
      },
    };
  } catch (err) {
    // Cloud failed → try local backup
    const local = loadLocalBackup(roll);
    if (local) {
      return { ok: true, data: local, localFallback: true };
    }
    const category = classifyError(err);
    return { ok: false, error: friendlyMessage(category) };
  }
}
