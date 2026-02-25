

# Smart Attendance Calculator - Implementation Plan

## Overview
A new page in the existing app that lets college students upload timetable and attendance images, extract data via AI-powered OCR, and get detailed attendance calculations with projections, what-if simulations, and PDF reports.

## Architecture

The OCR/image extraction will use **Lovable AI** (Gemini model with vision capabilities) through a backend function. No external OCR API keys needed. Users upload images, the AI extracts structured data, and the frontend handles all calculations client-side.

```text
+------------------+       +--------------------+       +------------------+
|   Upload Images  | ----> | Edge Function      | ----> | Lovable AI       |
|   (Frontend)     |       | (extract-timetable |       | (Gemini Vision)  |
|                  |       |  extract-attendance)|       |                  |
+------------------+       +--------------------+       +------------------+
        |
        v
+------------------+
| Editable Tables  |
| + Date Controls  |
| + Calculations   |
| + What-If Sim    |
| + Dashboard      |
| + PDF Export     |
+------------------+
```

## File Structure

### New Files

1. **`supabase/functions/extract-timetable/index.ts`** - Edge function that receives a timetable image (base64), sends it to Lovable AI (Gemini vision), and returns structured JSON with day-wise subject schedule.

2. **`supabase/functions/extract-attendance/index.ts`** - Edge function that receives an attendance image (base64), sends it to Lovable AI, and returns structured JSON with subject code, name, present, total, percentage.

3. **`src/pages/AttendanceCalculator.tsx`** - Main page component. Multi-step wizard layout:
   - Step 1: Upload timetable image + review/edit extracted schedule
   - Step 2: Upload attendance image + review/edit extracted data
   - Step 3: Configure date range, working days, holidays, target %
   - Step 4: Results dashboard with calculations, charts, what-if simulator, PDF export

4. **`src/types/attendance.ts`** - Type definitions:
   - `TimetableEntry` (day, period, subjectCode)
   - `SubjectAttendance` (code, name, present, total, percentage)
   - `AttendanceConfig` (fromDate, toDate, workingDays, holidays, targetPercentage)
   - `SubjectResult` (current%, required classes, bunkable classes, projected%)
   - `OverallResult` (totals, overall%, safe bunk limit)

5. **`src/lib/attendance-calculator.ts`** - Pure calculation functions:
   - `calculateSubjectWiseAttendance()` - current % and projections
   - `calculateRequiredClasses()` - classes needed to reach target
   - `calculateBunkableClasses()` - max classes that can be skipped
   - `calculateProjectedAttendance()` - projected % by end date
   - `whatIfSkip()` / `whatIfAttend()` - simulator functions
   - `countWorkingDays()` - count days between dates excluding holidays
   - `getSubjectClassesInRange()` - use timetable to count future classes per subject

6. **`src/components/attendance/ImageUploader.tsx`** - Drag-and-drop image upload component with preview, loading state during AI extraction.

7. **`src/components/attendance/TimetableEditor.tsx`** - Editable table showing Mon-Sat schedule grid. Users can correct AI-extracted data.

8. **`src/components/attendance/AttendanceEditor.tsx`** - Editable table for subject attendance data (code, name, present, total). Auto-calculates percentage.

9. **`src/components/attendance/DateRangeConfig.tsx`** - Date pickers (from/to), working day toggles (Mon-Sat), holiday calendar picker, target % slider.

10. **`src/components/attendance/ResultsDashboard.tsx`** - Subject-wise cards with progress bars, color-coded status (green/yellow/red), overall stats, pie chart using Recharts.

11. **`src/components/attendance/WhatIfSimulator.tsx`** - Input slider/number for "skip X classes" or "attend X classes" with live recalculated projections.

12. **`src/lib/attendance-pdf.ts`** - PDF generation using jsPDF + jspdf-autotable (already installed). Includes student details, date range, subject breakdown, overall summary, and charts.

### Modified Files

13. **`src/App.tsx`** - Add route: `/attendance` pointing to `AttendanceCalculator`.

14. **`src/components/Navbar.tsx`** - Add "Attendance" nav item with `CalendarCheck` icon to `navItems` array.

## Calculation Logic

### Subject-wise calculations:
- **Current %** = (attended / conducted) * 100
- **Future classes** = count from timetable * remaining working days in date range
- **Required to reach target** = ceil((target * (conducted + future) - attended) / 100) if current < target, else 0
- **Bunkable** = floor(attended - (target/100 * conducted)) if current > target, else 0
- **Projected %** = (attended / (conducted + future)) * 100 (worst case: skip all future)

### What-If:
- Skip X: new% = attended / (conducted + X) * 100
- Attend X: new% = (attended + X) / (conducted + X) * 100

### Status colors:
- Green (Safe): current% >= target% + 5
- Yellow (Warning): target% <= current% < target% + 5
- Red (Critical): current% < target%

## Edge Function Details

Both edge functions will send the image as base64 in the prompt to Gemini vision model, requesting structured JSON output via tool calling. The system prompt will instruct the model to extract tabular data from the image precisely.

## UI/UX Design

- Follows existing app's "pop" design language (Fredoka headings, rounded borders, colorful accents)
- Step indicator similar to Grade Calculator's `StepIndicator`
- Responsive layout with mobile-first approach
- All data stored in React state (session-only, no login required)
- Framer Motion animations consistent with existing pages

## Technical Notes

- No database tables needed (session-only storage)
- No authentication required
- Uses existing dependencies: recharts, jspdf, jspdf-autotable, framer-motion, date-fns
- Lovable AI with `google/gemini-2.5-flash` for fast, cost-effective image processing
- Holiday selection uses the existing Calendar component with multi-select mode

