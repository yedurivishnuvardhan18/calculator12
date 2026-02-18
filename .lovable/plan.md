

# Persist Grade Calculator Data in Local Storage

## Overview
Save the grade calculator state (courses, CGPA inputs, and UI flags) to `localStorage` so that if the user accidentally closes the browser, their data is automatically restored. Data will expire after 24 hours.

## How It Works
- Every time the user changes a course (adds, removes, edits grades, toggles lab, etc.) or calculates CGPA, the state is saved to `localStorage` with a timestamp.
- On page load, if saved data exists and is less than 24 hours old, it is restored automatically.
- If the data is older than 24 hours, it is cleared and the user starts fresh.

## Changes

### 1. Create: `src/hooks/use-persisted-grades.ts`
- A custom hook `usePersistedGrades` that wraps `useState` with localStorage persistence.
- Saves/loads: `courses` array, `showCGPA` flag, and `cgpaData`.
- Stores a `savedAt` timestamp alongside the data.
- On load, checks if `Date.now() - savedAt < 24 * 60 * 60 * 1000`; if expired, returns default state.
- Uses a `localStorage` key like `grade_calculator_state`.
- Debounces writes to avoid excessive storage calls on rapid input.

### 2. Modify: `src/pages/GradeCalculator.tsx`
- Replace the three `useState` calls (`courses`, `showCGPA`, `cgpaData`) with the single `usePersistedGrades` hook.
- All existing `setCourses`, `setShowCGPA`, `setCGPAData` calls remain the same since the hook exposes identical setter functions.
- No other component changes needed since the data flows down via props as before.

## Technical Details
- **Storage key**: `grade_calculator_state`
- **Expiry**: 24 hours from last save
- **Serialization**: `JSON.stringify` / `JSON.parse` on the full state object
- **Fallback**: If parsing fails or data is corrupted, defaults to a single empty course with no CGPA
