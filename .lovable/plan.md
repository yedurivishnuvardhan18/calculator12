
Goal: eliminate the recurring “Failed to send a request to the Edge Function” error on `/gitam-results` by making function calls resilient and reducing timeout/fetch-failure scenarios.

What I found from investigation:
1) Frontend currently calls:
- `supabase.functions.invoke("gitam-proxy/results", { body })`
- `supabase.functions.invoke("gitam-proxy/attendance", { body })`
in `src/pages/GitamResults.tsx`.

2) Backend function and route exist and are reachable:
- Direct POST to `/functions/v1/gitam-proxy/results` returned 200 with valid JSON.
- CORS headers are present in the function code.
- `gitam_cache` table exists and is writable/readable.
So this is not a “missing function” issue right now.

3) The user-facing error is transport-level (“Failed to fetch”), which usually means browser/network/preflight/timeout interruption rather than clean JSON error handling.

4) Attendance path appears more fragile (direct probe had cancellation once), suggesting upstream dependency slowness can trigger intermittent gateway/browser fetch failures.

Implementation plan (when approved):
1) Harden client-side calling logic in `src/pages/GitamResults.tsx`
- Replace direct `supabase.functions.invoke("gitam-proxy/<endpoint>")` usage with a small request wrapper that:
  - uses explicit timeout via `AbortController` (e.g., 20s),
  - retries transient failures once or twice with small backoff,
  - classifies network vs backend errors (timeout, CORS/network, server JSON error),
  - preserves existing UI state handling (loading, error, data sections).
- Keep the same endpoint contract (`results`, `attendance`) to avoid UX changes.

2) Make endpoint routing less brittle in `supabase/functions/gitam-proxy/index.ts`
- Accept both:
  - path-based routes (`/results`, `/attendance`) and
  - action-based body route fallback (e.g., `{ action: "results" | "attendance" }`) to avoid failures if path forwarding changes.
- Add stronger request validation and return structured JSON for invalid route/body cases with CORS headers.

3) Add upstream timeout protection in function
- Wrap external `fetch` calls to GITAM endpoints with bounded timeouts (AbortController per request).
- Return clear JSON errors like:
  - `Upstream timeout. Please retry in a few seconds.`
instead of hanging and causing opaque client fetch failures.

4) Improve observability for recurring incidents
- Add lightweight logs inside function for:
  - request type (`results`/`attendance`),
  - cache hit/miss,
  - upstream latency buckets,
  - timeout/error category.
- Keep logs non-sensitive (no cookie contents, no personal data dumps).

5) UX fallback improvements (same page)
- Show user-friendly retry guidance in error banner:
  - “Network or server timeout. Please try again.”
- Keep previous successful result visible when a new request fails (avoid blanking both panels immediately before call succeeds).

Files to update:
- `src/pages/GitamResults.tsx` (robust fetch wrapper + retry/timeout + better error UX)
- `supabase/functions/gitam-proxy/index.ts` (dual routing + upstream timeouts + clearer errors + minimal logs)

Validation checklist after implementation:
1) Results request works repeatedly for same reg/sem without random fetch-fail popup.
2) Attendance request handles slow upstream with clear timeout message (no opaque “Failed to fetch”).
3) Error responses always include CORS headers.
4) Cache still works (`marks:*` and `atd:*` keys updated/read).
5) Mobile and desktop both show readable error states and recovery path.

Technical notes:
- This plan does not require database schema changes.
- Existing secret setup is sufficient (`GITAM_SESSION_COOKIE`, backend keys already present).
- Root issue is treated as intermittent transport/timeouts, so resilience is added at both client and function layers to prevent repeated user-facing failure loops.
