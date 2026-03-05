

## Plan: Add 6 Features to GradeGuru

### Overview
Add skeleton screens, command palette, interactive charts, AI feedback, enhanced toasts, and error boundaries — all matching the existing dark theme with pop colors, Tailwind, shadcn/ui, and Recharts.

### 1. Skeleton Screens

The app already uses the shadcn `Skeleton` component in Learn pages. We'll enhance it with shimmer animation and add skeletons where missing.

**Changes:**
- **`src/index.css`** — Add shimmer keyframe and `.skeleton-shimmer` utility with dark mode support
- **`src/pages/GitamResults.tsx`** — Replace `<Loader2>` spinner during search with skeleton rows matching the results table layout (student banner skeleton + table row skeletons)
- **`src/pages/Index.tsx`** — Add loading state for initial habit data fetch; show skeleton table rows and stat card skeletons while data loads
- **`src/pages/GradeCalculator.tsx`** — This page is purely client-side (no fetch), so no skeleton needed; it renders instantly
- **Learn pages** already have skeletons — enhance them with shimmer animation class

### 2. Command Palette (Cmd+K)

**New file: `src/components/CommandPalette.tsx`**
- Uses existing `cmdk` + shadcn `Command` component (already installed)
- Global `useEffect` listener for Cmd+K / Ctrl+K
- Navigation items: Grade Calculator, Habit Tracker, Learn, Feedback, GITAM Results
- Quick actions: Toggle theme, Add course, Add habit
- Mounted in `App.tsx` at root level
- Styled to match the existing dark theme

**`src/App.tsx`** — Import and render `<CommandPalette />`

### 3. Interactive Grade Charts

**New file: `src/components/calculator/InteractiveCharts.tsx`**
- 3 charts using Recharts (already installed): Bar (credits per grade), Line (grade points across courses), Pie/Donut (grade letter distribution)
- Takes `courses` array as prop, computes chart data from it
- Shows skeleton rectangles when no valid course data exists yet
- Responsive grid: 1 col mobile, 3 col desktop
- Uses existing Card styling

**`src/pages/GradeCalculator.tsx`** — Add `<InteractiveCharts courses={courses} />` below the CGPA section

### 4. AI Feedback Generator

This feature is designed for "student grade view" — in this app, the closest equivalent is the GitamResults page where individual student results are displayed.

**New file: `src/components/AiFeedbackModal.tsx`**
- Dialog with "Generate Feedback" trigger button
- Calls a Lovable AI edge function with student name + grades
- Shows shimmer skeleton while generating
- Editable textarea for result, Copy + Save buttons
- Uses existing shadcn Dialog

**New edge function: `supabase/functions/ai-feedback/index.ts`**
- Accepts student data, calls Lovable AI gateway
- Returns generated feedback text

**`src/pages/GitamResults.tsx`** — Add "Generate Feedback ✨" button in the ResultsView student banner

### 5. Toast Notifications

Sonner is already installed and `<Toaster />` (sonner) is already in `App.tsx`. The app already uses `toast` from `@/hooks/use-toast` in several places.

**Changes:**
- **`src/pages/GitamResults.tsx`** — Add toast on successful results/attendance fetch, and on error
- **`src/pages/admin/*`** — Add toasts on CRUD operations (branches, subjects, modules, topics, videos) where missing
- **`src/pages/Index.tsx`** — Already has toasts; verify coverage for save/delete habit actions
- Audit all pages for missing feedback on user actions

### 6. Error Boundary

**New file: `src/components/ErrorBoundary.tsx`**
- Class component catching render errors
- Friendly fallback UI with icon, "Something went wrong" message, "Try Again" button
- Matches existing card/button styles

**New file: `src/components/BugReportButton.tsx`**
- Fixed bottom-left floating ⚠️ icon button
- Opens a lightweight modal to type a bug report
- Logs to console + shows success toast

**`src/App.tsx`** — Wrap each Route's element with `<ErrorBoundary>`; add `<BugReportButton />` at root

### File Summary

| Action | File |
|--------|------|
| Create | `src/components/CommandPalette.tsx` |
| Create | `src/components/calculator/InteractiveCharts.tsx` |
| Create | `src/components/AiFeedbackModal.tsx` |
| Create | `src/components/ErrorBoundary.tsx` |
| Create | `src/components/BugReportButton.tsx` |
| Create | `supabase/functions/ai-feedback/index.ts` |
| Edit | `src/index.css` (shimmer animation) |
| Edit | `src/App.tsx` (command palette, error boundary, bug report) |
| Edit | `src/pages/GradeCalculator.tsx` (interactive charts) |
| Edit | `src/pages/GitamResults.tsx` (skeletons, AI feedback button, toasts) |
| Edit | `src/pages/Index.tsx` (loading skeletons) |
| Edit | Learn pages (shimmer class on existing skeletons) |
| Migration | None needed |

