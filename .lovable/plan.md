
Issue diagnosis (what is actually happening):
- The request from `/attendance` reaches `POST /functions/v1/extract-timetable` in the browser, but the browser reports `Error: Failed to fetch`.
- There are no backend function logs for user attempts, while direct server-side invocation succeeds. This strongly indicates the failure happens before function logic runs (browser preflight/CORS or gateway-level rejection), not inside OCR code.
- The uploaded timetable image payload is very large (long base64 body), so there are two likely browser-facing failure points:
  1) preflight/CORS mismatch, and/or
  2) payload size/network rejection before function execution.
- Current uploader sends full-resolution base64 directly; no resizing/compression is applied.

Implementation plan to fix the repeated error:

1) Harden backend function CORS handling (both extraction functions)
- Files:
  - `supabase/functions/extract-timetable/index.ts`
  - `supabase/functions/extract-attendance/index.ts`
- Changes:
  - Use canonical browser CORS headers from the SDK (`@supabase/supabase-js/cors`) or explicitly include:
    - `Access-Control-Allow-Origin`
    - `Access-Control-Allow-Headers`
    - `Access-Control-Allow-Methods`
  - Ensure OPTIONS handler returns `new Response("ok", { headers: corsHeaders })`.
  - Ensure every response path (success + all errors) includes identical CORS headers.
- Why:
  - Prevents browser preflight from failing silently with generic “Failed to fetch”.

2) Add client-side image preprocessing before invoking backend
- File:
  - `src/components/attendance/ImageUploader.tsx`
- Changes:
  - Before calling `onImageSelected`, resize/compress image via canvas:
    - constrain max width/height (for OCR-friendly sizes, e.g. 1600–2000 px max side),
    - export JPEG/WEBP with quality tuning (e.g. 0.75–0.85),
    - strip unnecessary metadata by re-encoding.
  - Add a safety cap for final base64 length and show a clear toast/error if still too large.
- Why:
  - Reduces chance of gateway/body-size/network failures.
  - Speeds up uploads and OCR turnaround.

3) Improve frontend error reporting for function invocation
- File:
  - `src/pages/AttendanceCalculator.tsx`
- Changes:
  - In both extraction handlers, detect network-style fetch failures and show a user-friendly message (e.g., “Image too large or network blocked. Try a smaller/cropped image.”).
  - Keep preview visible and show retry guidance instead of generic “Extraction failed”.
- Why:
  - Converts opaque fetch errors into actionable guidance.

4) Add optional quick fallback UX when OCR fails
- Files:
  - `src/pages/AttendanceCalculator.tsx`
  - `src/components/attendance/ImageUploader.tsx` (minor props/UI text)
- Changes:
  - If extraction fails, keep user in flow with immediate manual entry path (timetable/attendance editors already exist).
  - Show “Continue with manual entry” CTA.
- Why:
  - Prevents hard blocker when OCR/network is unstable.

5) Verification plan (end-to-end)
- Re-test from `/attendance` with:
  - a normal screenshot,
  - a very large screenshot,
  - mobile-uploaded image.
- Confirm:
  - preflight succeeds,
  - function logs appear for successful attempts,
  - large images are compressed client-side and no longer fail with generic fetch errors,
  - user can still proceed manually if OCR fails.
- Regression checks:
  - attendance image extraction still works,
  - loading/preview states remain correct,
  - no change to calculation/PDF pipeline.

Technical notes:
- No database schema changes needed.
- No auth or policy changes needed.
- Root fix focuses on transport reliability (CORS + payload size) rather than OCR prompt logic.
