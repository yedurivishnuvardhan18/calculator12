

## Plan: Fix Mobile Responsiveness

### Root Cause
The `useIsMobile()` hook initializes `isMobile` as `undefined`. Since `!!undefined === false`, the navbar renders the **desktop layout on first paint** even on mobile devices. By the time the `useEffect` runs and detects the correct width, the desktop nav items are already visible and overflow the screen — the hamburger menu never appears.

### Fix

**`src/hooks/use-mobile.tsx`** — Initialize state using `window.innerWidth` instead of `undefined`:
- Change initial state from `undefined` to `typeof window !== 'undefined' ? window.innerWidth < 768 : false`
- This ensures the very first render correctly shows mobile or desktop layout

**`src/components/Navbar.tsx`** — Add CSS-based responsive fallback:
- Add `overflow-x-hidden` to the nav container to prevent horizontal scroll if the hook hasn't resolved yet
- Ensure the hamburger button and mobile menu are always reachable on small screens

**`src/pages/WhatIfCalculator.tsx`** — Minor mobile tweaks:
- The scenario comparison grid already uses `grid-cols-1 sm:grid-cols-3`, which is correct
- Ensure the future semester cards' slider + input layout stacks properly on very small screens

### Files Changed

| Action | File |
|--------|------|
| Edit | `src/hooks/use-mobile.tsx` (fix initial state) |
| Edit | `src/components/Navbar.tsx` (overflow safety) |

This is a small, targeted fix — no layout redesign needed.

