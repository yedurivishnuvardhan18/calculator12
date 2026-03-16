

## Plan: Math Puzzle Lock

### Overview
Create a fullscreen math puzzle lock that blocks access to the website until the user solves a math question. The lock uses sessionStorage so it persists per tab session. No existing files are modified except `src/App.tsx` (to wrap content with the lock gate).

### New Files

**`src/data/mathQuestions.ts`** — All 300 questions (100 per level) as typed arrays:
```ts
type MathQuestion = { q: string; a: number };
export const easyQuestions: MathQuestion[] = [...]; // 100
export const mediumQuestions: MathQuestion[] = [...]; // 100
export const hardQuestions: MathQuestion[] = [...]; // 100
```

**`src/components/MathPuzzleLock.tsx`** — The lock component with 3 screens:

- **State management via sessionStorage**:
  - `math_lock_unlocked` — boolean, skip lock if true
  - `math_lock_used_easy/medium/hard` — JSON array of used question indexes
  - `math_lock_cooldown_until` — timestamp for cooldown end
  - `math_lock_level` — selected level

- **Screen 1 — Level Selection**: 3 cards (Easy/Medium/Hard) with emoji, color, star rating, "100 Unique Questions" label. Dark blurred fullscreen overlay.

- **Screen 2 — Question Screen**:
  - Pick next unused question index from the pool for selected level
  - Show question text, numeric input (`inputMode="numeric"`), submit button
  - "Question N of 100" tracker
  - Attempt counter: "Attempts: X/5"
  - Wrong answer: shake animation + red flash
  - After 2 wrong: show hint (first digit or range)
  - After 5 wrong: 60s cooldown timer, then auto-load next unused question
  - "← Change Level" button
  - When all 100 exhausted: reshuffle (clear used indexes), restart pool

- **Screen 3 — Access Granted**: Green checkmark animation, "🎉 Access Granted!" text, auto-dismiss after 1.5s, sets `math_lock_unlocked = "true"` in sessionStorage

- **Design**: Fixed overlay `z-[9999]`, dark blurred backdrop, matches existing dark theme colors (`hsl(240,15%,8%)` background), Fredoka/Space Grotesk fonts, fully responsive

### Modified File

**`src/App.tsx`** — Wrap the entire app content with `MathPuzzleLock`:
```tsx
import { MathPuzzleLock } from "./components/MathPuzzleLock";
// ... existing imports unchanged

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <MathPuzzleLock>
          {/* all existing content unchanged */}
        </MathPuzzleLock>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
```

The `MathPuzzleLock` component checks `sessionStorage.getItem("math_lock_unlocked")` — if `"true"`, renders children directly. Otherwise shows the lock overlay on top of (or instead of) children.

### File Summary

| Action | File |
|--------|------|
| Create | `src/data/mathQuestions.ts` (300 questions) |
| Create | `src/components/MathPuzzleLock.tsx` (lock UI + logic) |
| Edit | `src/App.tsx` (wrap with lock gate) |

No new dependencies. No existing UI changes. Pure sessionStorage, no backend.

