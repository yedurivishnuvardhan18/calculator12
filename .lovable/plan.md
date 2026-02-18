

# Download Grade Card as Excel

## Overview
Add a "Download Grade Card" button that appears after SGPA is calculated. The downloaded Excel file will contain a styled grade card with course details and overall results.

## Grade Card Contents

The Excel file will include:

**Course Table:**
| Subject Name | Sessional 1 | Sessional 2 | Final Grade | Credits |
|---|---|---|---|---|
| Mathematics | A+ | A | A+ | 3 |
| Physics | B+ | A | A | 4 |

**Summary Section:**
- SGPA: 8.50
- Total Credits: 20
- CGPA: 8.25 (only if calculated)

## Changes

### 1. New file: `src/lib/gradecard-generator.ts`
- Create a function `generateGradeCard(courses, sgpaResult, cgpaData?)` using ExcelJS (already installed)
- Build a styled Excel workbook with:
  - A header row: "Subject Name", "Sessional 1", "Sessional 2", "Final Grade", "Credits"
  - One row per valid course, showing the sessional grade labels and final letter grade
  - A blank spacer row
  - An SGPA summary row with the calculated value
  - If CGPA data is provided, a CGPA row as well
- Apply styling consistent with the pop-art theme (bold headers, colored cells, borders)
- Download the file as `grade-card.xlsx` using `file-saver`

### 2. Modify: `src/components/calculator/SGPASection.tsx`
- Add a "Download Grade Card" button next to the "Calculate CGPA" button
- The button appears only after SGPA results are shown
- Pass `courses` and `cgpaData` to the generator function on click
- Use a Download icon from lucide-react

## Technical Notes
- ExcelJS and file-saver are already installed in the project, so no new dependencies needed
- Sessional grades come from `course.assessments[0].gradeLabel` (S1) and `course.assessments[1].gradeLabel` (S2)
- Final grade comes from `course.letterGrade`
- The button will be styled to match the existing pop-art design with the download icon
