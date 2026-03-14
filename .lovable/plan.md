

## Plan: Add Voice Input to Grade Calculator

### Understanding the Input System

The grade calculator has these input types:
1. **Grade select dropdowns** (Sessional 1, Sessional 2, Learning Engagement) — these are `<select>` elements with options like O, A+, A, B+, B, C, P, I, Ab/R
2. **Numeric inputs**: Course name (text), Credits (number), Marks (number, 0-100), Lab marks (number, 0-100), Absolute marks (number), Max marks (number)
3. **CGPA inputs**: Previous CGPA (number, 0-10), Previous Credits (number)
4. **CLAD grade select**: Another dropdown for CLAD courses

Voice input makes most sense on the **select dropdowns** (speak "A plus" to select A+) and **numeric inputs** (speak "eighty five" to enter 85).

### New Files

**`src/hooks/use-voice-input.ts`** — Custom hook wrapping Web Speech API
- Singleton SpeechRecognition instance (only one active at a time)
- States: idle, listening, success, error
- Word-to-number parser (handles "eighty five", "seventy five point five", etc.)
- Grade label parser (handles "A plus" → "A+", "B plus" → "B+", "O" → "O", etc.)
- Auto-stop after 5s silence
- Browser support detection (`window.SpeechRecognition || window.webkitSpeechRecognition`)
- Returns `{ isListening, startListening, status, isSupported }`

**`src/components/calculator/VoiceMicButton.tsx`** — Reusable mic button component
- Props: `onResult(value: string)`, `type: 'number' | 'grade'`, `min?`, `max?`
- Grey mic icon default → Red pulsing when listening → Green check on success → Red X on error
- "Listening..." text shown below input when active
- Tooltip: "Click to speak your grade"
- Pulsing ripple animation via Tailwind keyframes
- Hidden entirely if browser doesn't support Web Speech API

**`src/components/calculator/VoiceModeBar.tsx`** — Global voice mode toggle
- Toggle button at top of grade calculator: "Voice Mode 🎤"
- When ON: banner "Voice Mode Active — Say your subject and grade 🎤"
- Cycles through inputs sequentially, highlights current field with glow
- Parses compound speech like "Math 85, Science 90"
- Auto-triggers calculation when all fields filled

### Modified Files

**`src/index.css`** — Add voice-related keyframes
- `@keyframes voice-pulse` for the red pulsing ripple effect
- `@keyframes voice-success` for the green flash on input fields
- `.voice-active-glow` class for highlighting current field in voice mode

**`src/components/calculator/CourseCard.tsx`** — Add mic buttons
- Import `VoiceMicButton`
- Add mic button next to each grade `<select>` dropdown (Sessional 1, 2, LE)
- Add mic button next to marks inputs, lab marks input, absolute marks inputs
- Add mic button next to course name and credits inputs
- On voice result: call existing `updateAssessmentGrade()` / `updateAssessmentMarks()` / `onUpdate()` handlers
- No layout changes — mic button sits inline or absolutely positioned

**`src/components/calculator/CGPASection.tsx`** — Add mic buttons
- Add mic button next to Previous CGPA and Previous Credits inputs

**`src/pages/GradeCalculator.tsx`** — Add VoiceModeBar
- Import and render `<VoiceModeBar />` between the header and step indicator
- Pass courses + setCourses for sequential voice filling

### Animation Details (in `src/index.css`)

```css
@keyframes voice-pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

@keyframes voice-success-flash {
  0% { background-color: inherit; }
  50% { background-color: rgba(16, 185, 129, 0.2); }
  100% { background-color: inherit; }
}
```

### Voice Parsing Logic (in hook)

- Numbers: "zero" through "one hundred", decimals ("point five" → .5)
- Grades: "O" → O, "A plus" → A+, "A" → A, "B plus" → B+, "B" → B, "C" → C, "P" → P
- Validation: numbers clamped to min/max, show error toast if out of range
- Toast notifications via sonner for all states (success, error, permission denied)

### File Summary

| Action | File |
|--------|------|
| Create | `src/hooks/use-voice-input.ts` |
| Create | `src/components/calculator/VoiceMicButton.tsx` |
| Create | `src/components/calculator/VoiceModeBar.tsx` |
| Edit | `src/index.css` (voice animations) |
| Edit | `src/components/calculator/CourseCard.tsx` (mic buttons) |
| Edit | `src/components/calculator/CGPASection.tsx` (mic buttons) |
| Edit | `src/pages/GradeCalculator.tsx` (voice mode bar) |

No new dependencies needed — Web Speech API is built into browsers.

