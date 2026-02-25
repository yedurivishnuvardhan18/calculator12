
Goal: stop the repeated “Extraction failed — Failed to send a request to the Edge Function” error and make `.txt` uploads work even if the browser can’t reach backend functions.

What I found from investigation:
- The backend functions are currently healthy and text-capable:
  - direct calls to `extract-timetable` and `extract-attendance` return `200`
  - response headers include `X-Function-Version: 2026-02-25-text-support-v2`
- In your failing browser attempt, request body was correctly built (`textContent`), but it ended with `Failed to fetch`.
- That specific failure means the request likely failed before function execution (browser/network/CORS preflight layer), because there is no matching function execution log at that request time.
- I also noticed the failing payload was attendance-style text sent to `extract-timetable` (step 1). That won’t cause `Failed to fetch`, but it’s a UX mismatch we should guard against.

Do I know what the issue is?
Yes:
1) Primary issue: browser-side transport/preflight failure to backend function endpoint (not extraction logic).
2) Secondary issue: fragile dependency on backend for `.txt`, so any temporary network/preflight issue breaks the entire flow.

Implementation plan (fix + practical alternative):

1. Harden backend function CORS/preflight handling (both functions)
Files:
- `supabase/functions/extract-timetable/index.ts`
- `supabase/functions/extract-attendance/index.ts`

Changes:
- In `OPTIONS` handler, echo requested headers dynamically:
  - read `access-control-request-headers` from request
  - return that value in `Access-Control-Allow-Headers`
- Always return explicit:
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Max-Age` (preflight cache)
- Keep `Access-Control-Allow-Origin: *` and ensure all success/error responses include full CORS headers.
- Add lightweight request tracing logs for method/origin/header list so future transport issues are diagnosable quickly.

Why:
- Prevents failures when client/runtime adds headers not present in hardcoded allowlist.
- Reduces intermittent browser-side “Failed to fetch” preflight breaks.

2. Add deterministic local parser for `.txt` files (network-independent fallback and default path)
New file:
- `src/lib/attendance-text-parser.ts`

Implement:
- `parseAttendanceText(text): SubjectAttendance[] | null`
  - robust line parser for rows like:
    `CODE  Subject Name  Present  Total  Percentage`
  - support irregular spaces and missing `%` symbol
  - sanitize control chars (`\f`, repeated whitespace)
- `parseTimetableText(text): TimetableSchedule | null`
  - support common formats:
    - `Monday: CS101, MA101, ...`
    - table-like day rows
  - normalize day aliases (Mon/Monday, Tue/Tuesday, etc.)
- Return confidence/validity signals (minimum parsed rows, required days).

Why:
- `.txt` extraction should not rely on backend AI for common structured files.
- Eliminates this class of network-related blocking for `.txt`.

3. Use local parser first for text uploads, then backend AI fallback only if parsing confidence is low
File:
- `src/pages/AttendanceCalculator.tsx`

Changes:
- In `extractTimetable` and `extractAttendance`:
  - if `result.type === "text"`:
    - attempt local parser first
    - if success: set state immediately and show “Parsed locally” toast
    - if fail: call backend function as fallback
- Keep image flow unchanged (AI extraction + image retry logic).
- Improve transport error messages:
  - map function-fetch errors to: “Couldn’t reach backend service. We’ll keep local parsing for .txt; check connection or retry.”

Why:
- Makes `.txt` flow fast and resilient.
- Backend remains available for complex/unstructured text.

4. Add guardrails for wrong-file-in-wrong-step UX
File:
- `src/pages/AttendanceCalculator.tsx` (or parser helper)

Changes:
- If step 1 text strongly matches attendance table (has `present`, `total`, `percentage` columns):
  - show clear toast: “This looks like attendance data—please upload it in Step 2.”
  - optionally offer auto-step switch (if existing UI pattern supports it).
- If step 2 text looks timetable-like, do equivalent warning.

Why:
- Prevents confusion from uploading attendance text into timetable extractor.

5. Keep manual-edit alternative always usable
Existing components already support manual editing:
- `TimetableEditor`
- `AttendanceEditor`

Small UX additions:
- add hint text near uploader:
  - “If upload fails, you can paste/edit data manually below.”
- ensure editor remains visible for quick manual entry when extraction fails.

Why:
- Gives user progress path even during transient network issues.

Validation checklist (end-to-end):
1) Timetable `.txt` with clean format:
- parses locally, no backend call required, editor fills.
2) Attendance `.txt` with copied portal text (including odd spacing/form feed):
- parses locally or falls back and still succeeds.
3) Simulated backend unreachable case:
- `.txt` still works via local parser.
4) Image uploads still work:
- AI extraction + retry unchanged.
5) Wrong-step upload:
- user gets clear corrective prompt.
6) Regression:
- step navigation, calculations, and PDF generation remain intact.

Scope and risk:
- No database schema changes required.
- No auth flow changes required.
- Main risk is parser strictness; mitigated by backend fallback for ambiguous text.
- This is the most reliable path because it fixes transport fragility and removes backend dependency for `.txt` at the same time.
