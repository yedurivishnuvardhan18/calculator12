

## Plan: Simplified What-If CGPA Predictor

### Concept Change
Instead of asking SGPA for every past semester, the user enters just **2 values** for their history:
- **Current CGPA** (e.g., 7.76)
- **Total Credits Completed** (e.g., 100)

Then they select how many **upcoming semesters** to simulate (1-4), enter credits and a What-If SGPA for each, and instantly see their predicted CGPA.

### New File

**`src/pages/WhatIfCalculator.tsx`**

**Section 1 — Current Standing (2 inputs)**
- "Your Current CGPA" — number input (0-10)
- "Total Credits Completed" — number input

**Section 2 — Future Semesters**
- "How many upcoming semesters to predict?" — dropdown (1, 2, 3, 4)
- For each future semester: a row with editable credits (default 20) + SGPA slider (0-10) with number input side by side
- Highlighted in indigo/purple with "🎯 What-If" tag

**Section 3 — Scenario Comparison**
- 3 columns: Pessimistic 😴 / Realistic 😐 / Optimistic 🔥
- Each column auto-fills What-If SGPAs (e.g., -1.0 / as-is / +1.0 from entered values)
- Shows resulting CGPA per column

**Section 4 — Live Results Card**
- Big CGPA number, previous vs new comparison with delta arrow
- Progress bar colored by tier (Outstanding/Distinction/Good/Average/Needs Improvement)
- Milestone proximity message

**Section 5 — Reverse Calculator**
- "What SGPA do I need to reach CGPA [___]?"
- Shows required SGPA, "Achievable ✅" or "Not possible ❌"

**Section 6 — Save & Share**
- localStorage persistence, WhatsApp share

**Formula:**
```
New CGPA = (Current CGPA × Completed Credits + Σ(Future SGPA × Future Credits)) / (Completed Credits + Σ(Future Credits))
```

### Modified Files

**`src/components/Navbar.tsx`** — Add nav item: `{ to: "/what-if", label: "What-If Calculator", icon: Target }`

**`src/App.tsx`** — Add route: `<Route path="/what-if" element={<WhatIfCalculator />} />`

### File Summary

| Action | File |
|--------|------|
| Create | `src/pages/WhatIfCalculator.tsx` |
| Edit | `src/components/Navbar.tsx` (add nav item) |
| Edit | `src/App.tsx` (add route + import) |

No new dependencies. No database changes. Pure client-side math.

