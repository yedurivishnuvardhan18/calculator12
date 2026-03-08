

## Plan: Redesign What-If Calculator UX

### Current Problem
The calculator asks for SGPA for every semester individually, which is tedious. Most students already know their current CGPA and total credits completed.

### New Flow

**Step 1: Current Status**
- Input: Current CGPA (e.g., 7.5)
- Input: Total credits completed so far (e.g., 100)
- This represents all past work in a single value

**Step 2: Future Semesters**
- Dropdown: "How many future semesters?" (1-6)
- For each future semester:
  - Input: Credits for that semester
  - Input/Slider: Expected SGPA for that semester

**Step 3: Results**
- Live-updating Predicted CGPA
- Comparison: Current 7.5 → Predicted 7.8 (+0.3)
- Same tier badges and milestone messages
- Same 3 scenario columns (Pessimistic/Realistic/Optimistic)

### Calculation
```
Total Points = (Current CGPA × Completed Credits) + Σ(Future SGPA × Future Credits)
Total Credits = Completed Credits + Σ(Future Credits)
Predicted CGPA = Total Points / Total Credits
```

### Changes to `src/pages/WhatIfCalculator.tsx`

**State changes:**
- Remove: `semesters` array with completed/what-if toggles
- Add: `currentCGPA`, `completedCredits`
- Add: `futureSemesters` (count dropdown)
- Add: `futureSemesterData` array with `{ credits, sgpa }` for each future semester

**UI sections to update:**
1. Setup → "Current Status" card with CGPA + credits inputs
2. Remove semester table with toggle buttons
3. Add "Future Semesters" section with simple rows (no toggle needed)
4. Results card stays mostly same, just update formula
5. Scenarios stay same but apply to future semesters only
6. Reverse calculator stays same logic

**Save/load:**
- Update localStorage schema to new format
- Migration: if old format detected, show "Reset to use new calculator"

### File Summary
| Action | File |
|--------|------|
| Edit | `src/pages/WhatIfCalculator.tsx` (complete rewrite of logic) |

