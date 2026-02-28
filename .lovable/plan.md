
Goal
Eliminate the persistent “TypeError: Failed to fetch” experience during roll-number save by making saves resilient to client/network/cache issues and giving clear, actionable feedback to users.

What I verified
1) Backend schema/access is currently correct in the Test backend:
- `saved_grade_cards` has a plain unique index on `roll_number`.
- Row-level access rules for insert/select/update are permissive for this public feature.
2) A live browser save test inserted `TESTFAIL1` successfully in the database.
3) This means the core save path can work, but users can still hit client-side fetch failures (network/runtime/cache path), which currently surfaces as a confusing generic failure.

Proposed implementation
1) Create a single shared save/load backend helper layer
- Add a small utility (e.g., `src/lib/grade-card-storage.ts`) used by both:
  - `SavePromptDialog.tsx`
  - `RollNumberSave.tsx`
- Centralize:
  - roll normalization (`trim + uppercase`)
  - validation (5–20 alphanumeric)
  - structured error mapping
  - retry logic
- Benefit: both save entry points behave identically and are easier to debug.

2) Add robust retry + timeout for save/load operations
- Wrap save and load calls with:
  - timeout guard (e.g., 10–12s)
  - retry on transient network failures (`Failed to fetch`, abort, timeout), max 2 retries with short backoff
- Do not retry on clear validation/server logic errors.
- Benefit: temporary connection hiccups no longer instantly fail the user.

3) Improve user-facing error messages for fetch failures
- Replace raw “TypeError Failed to fetch” with user-friendly messaging:
  - “Couldn’t reach the backend right now. Please retry.”
  - plus short hint: “If this keeps happening, refresh once and try again.”
- Preserve technical detail in console logs for debugging.
- Benefit: users get understandable guidance instead of low-level error text.

4) Add an immediate local backup fallback when remote save fails
- If remote save still fails after retries, store the same payload in local storage under a dedicated fallback key by roll number.
- Show clear toast:
  - “Saved locally on this device. Cloud save failed; retry when online.”
- On next successful remote save, clear local fallback entry for that roll.
- Benefit: users do not lose work even during persistent connectivity issues.

5) Add “recover local backup” behavior in Load flow
- If cloud load fails or record not found, check local fallback for the entered roll.
- Offer to restore local backup if present.
- Benefit: safer recovery path and better UX under unstable networks.

6) Add lightweight diagnostics (non-intrusive)
- Log one concise diagnostic object on save/load failure:
  - operation (`save`/`load`)
  - normalized roll
  - error category (`network`, `timeout`, `validation`, `backend`)
  - retry count
  - online status (`navigator.onLine` when available)
- Benefit: future debugging becomes much faster without noisy logs.

7) Verify end-to-end across both entry points
- Save via SGPA popup.
- Save via top-right Save/Load panel.
- Load via Save/Load panel.
- Overwrite same roll (upsert behavior).
- Simulate offline/network failure path to confirm local backup + recovery behavior.
- Verify on both Preview and Published builds.

Why this approach
- Current backend configuration is not the blocker anymore; failures are likely happening in client connectivity/runtime paths for some users.
- This plan makes the feature resilient even when network calls intermittently fail, while preserving the intended cloud-backed roll-number flow.

Technical notes
- No changes to generated integration files.
- No auth model changes (public roll-number save/load remains as designed).
- Keep current database schema/index/policies unless new evidence appears.
- Main changes are frontend reliability and shared storage utilities.
