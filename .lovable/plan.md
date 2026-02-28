
# Auto-Prompt Save After SGPA and CGPA Calculation

## Overview
After the user calculates their SGPA or CGPA, a popup dialog will appear offering them three options: save the grade card via roll number, continue to calculate CGPA (after SGPA only), or dismiss with "Maybe Later."

## Changes

### 1. Create `src/components/calculator/SavePromptDialog.tsx`
A new dialog component that appears after calculation with these options:
- **Save via Roll Number** -- opens an inline roll number input + save button (reuses the existing save logic from `RollNumberSave`)
- **Calculate CGPA** -- only shown after SGPA calculation (not after CGPA), calls `onShowCGPA`
- **Maybe Later** -- dismisses the dialog

The dialog will use Radix `Dialog` component (already available in UI library) with the existing pop styling. It will accept props:
- `open` / `onClose`
- `type`: `"sgpa"` | `"cgpa"` -- controls whether "Calculate CGPA" option is shown
- `courses`, `showCGPA`, `cgpaData` -- for saving
- `onShowCGPA` -- callback for the CGPA option

Save logic: inline roll number input with validation (same 5-20 alphanumeric pattern), upsert to `saved_grade_cards` table.

### 2. Update `src/components/calculator/SGPASection.tsx`
- Add state `showSavePrompt` that gets set to `true` when SGPA result is first shown (alongside the confetti trigger)
- Render `<SavePromptDialog type="sgpa" />` with `onShowCGPA` passed through
- When user clicks "Calculate CGPA" in the dialog, it closes the dialog and calls `onShowCGPA`

### 3. Update `src/components/calculator/CGPASection.tsx`
- Add state `showSavePrompt` that gets set to `true` when CGPA result is first shown (alongside the confetti trigger)
- Render `<SavePromptDialog type="cgpa" />` (no "Calculate CGPA" option since they already did)

### 4. Pass necessary props
- `SGPASection` already receives `courses`, `onShowCGPA`, and `cgpaData` -- sufficient
- `CGPASection` already receives `courses` -- will pass `showCGPA` and `cgpaData` through the dialog

## Technical Details
- Reuses existing `supabase` client and `saved_grade_cards` table (no DB changes needed)
- Dialog uses `Dialog` from `@/components/ui/dialog`
- Roll number validation: `/^[A-Z0-9]{5,20}$/`
- Save uses `upsert` with `onConflict: "roll_number"`
- Toast notifications via `sonner` for success/error feedback
- Dialog styled with the existing pop design system (rounded corners, pop colors, font-display)
