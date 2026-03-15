

## Plan: Security Hardening (No UI Changes)

### 1. Input Validation & Sanitization — New utility file

**Create `src/lib/security.ts`**
- `sanitizeText(input: string, maxLen?: number): string` — strips HTML tags, script content, trims, enforces max length (default 100)
- `clampNumber(val: number, min: number, max: number): number` — clamps and rejects NaN/Infinity → returns min
- `safeParseFloat(val: string, fallback: number): number` — parseFloat with NaN guard
- `safeParseInt(val: string, fallback: number): number` — parseInt with NaN guard
- `safeCalc(fn: () => number, fallback: number): number` — try/catch wrapper returning fallback on error
- `MAX_COURSES = 20` constant

### 2. Apply validation in existing files (no UI changes)

**`src/components/calculator/CourseCard.tsx`**
- Sanitize course name on change: `sanitizeText(e.target.value, 100)`
- Clamp credits: `clampNumber(parseInt(val), 1, 10)`
- Clamp marks inputs: `clampNumber(parseFloat(val), 0, 100)`
- Clamp absolute marks similarly

**`src/pages/GradeCalculator.tsx`**
- Enforce `MAX_COURSES` limit in `addCourse()` — show toast if at limit

**`src/components/calculator/CGPASection.tsx`**
- Clamp previousCGPA (0-10) and previousCredits (1-999) on change

**`src/pages/WhatIfCalculator.tsx`**
- Sanitize/clamp all numeric inputs (CGPA, credits, SGPA)

**`src/pages/AttendanceCalculator.tsx`**
- Sanitize/clamp attended, total, dayClasses, target

### 3. localStorage Security

**`src/hooks/use-persisted-grades.ts`**
- Wrap `JSON.parse` in try/catch (already done), add schema validation: verify `courses` is array, each course has expected shape, clamp all numeric fields
- Sanitize course names on load

**`src/pages/WhatIfCalculator.tsx`** and **`src/pages/AttendanceCalculator.tsx`**
- Add similar validation on localStorage read — reject malformed data gracefully

### 4. Security HTTP Headers — `index.html`

Add meta tags in `<head>`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; font-src 'self';" />
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta http-equiv="X-Frame-Options" content="DENY" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

### 5. Calculation Safety

**`src/types/calculator.ts`**
- Wrap `calculateSGPA`, `calculateCGPA`, `calculateWGP`, `calculateAbsoluteGrade` return values with NaN/Infinity guards
- Add `safeDivide(a, b, fallback=0)` helper

### 6. Rate Limiting / Debouncing

- Already have debounced persistence in `use-persisted-grades.ts`
- Add course count limit (covered above)
- No additional debouncing needed — inputs are already controlled React state

### 7. Console Log Cleanup

- Search for and remove any `console.log` statements that might expose data

### File Summary

| Action | File |
|--------|------|
| Create | `src/lib/security.ts` |
| Edit | `index.html` (add security meta tags) |
| Edit | `src/components/calculator/CourseCard.tsx` (sanitize inputs) |
| Edit | `src/components/calculator/CGPASection.tsx` (clamp inputs) |
| Edit | `src/pages/GradeCalculator.tsx` (max courses limit) |
| Edit | `src/pages/WhatIfCalculator.tsx` (sanitize + validate localStorage) |
| Edit | `src/pages/AttendanceCalculator.tsx` (sanitize + validate localStorage) |
| Edit | `src/hooks/use-persisted-grades.ts` (validate localStorage data) |
| Edit | `src/types/calculator.ts` (NaN/Infinity guards) |

No UI changes. No new dependencies. No database changes.

