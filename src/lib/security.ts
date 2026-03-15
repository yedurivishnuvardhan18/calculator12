// ─── Security Utilities ───
// Input validation, sanitization, and safety helpers

export const MAX_COURSES = 20;

/** Strip HTML tags and script content, trim, enforce max length */
export function sanitizeText(input: string, maxLen = 100): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'`]/g, "")
    .trim()
    .slice(0, maxLen);
}

/** Clamp a number, rejecting NaN/Infinity → returns fallback (default min) */
export function clampNumber(val: number, min: number, max: number, fallback?: number): number {
  const fb = fallback ?? min;
  if (typeof val !== "number" || !Number.isFinite(val)) return fb;
  return Math.min(max, Math.max(min, val));
}

/** Parse float with NaN guard */
export function safeParseFloat(val: string, fallback: number): number {
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Parse int with NaN guard */
export function safeParseInt(val: string, fallback: number): number {
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Safe division — returns fallback if denominator is 0 or result is NaN/Infinity */
export function safeDivide(a: number, b: number, fallback = 0): number {
  if (b === 0 || !Number.isFinite(a) || !Number.isFinite(b)) return fallback;
  const result = a / b;
  return Number.isFinite(result) ? result : fallback;
}

/** Wrap a calculation in try/catch, returning fallback on error */
export function safeCalc(fn: () => number, fallback: number): number {
  try {
    const result = fn();
    return Number.isFinite(result) ? result : fallback;
  } catch {
    return fallback;
  }
}

/** Validate and sanitize a persisted JSON string, returns parsed object or null */
export function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Ensure a value is a finite number, otherwise return fallback */
export function ensureFinite(val: unknown, fallback: number): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  return fallback;
}

/** Ensure a value is a boolean, otherwise return fallback */
export function ensureBoolean(val: unknown, fallback: boolean): boolean {
  if (typeof val === "boolean") return val;
  return fallback;
}

/** Ensure a value is a string, sanitized */
export function ensureString(val: unknown, fallback = "", maxLen = 100): string {
  if (typeof val === "string") return sanitizeText(val, maxLen);
  return fallback;
}
