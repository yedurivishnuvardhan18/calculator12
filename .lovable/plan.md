

# Embed External Links Below Navbar with Light Bar on All Items

## Overview
Instead of navigating away when clicking external links, the app will show the external content in a full-page iframe below the navbar. The glowing light bar indicator will also extend to cover all navigation items (both internal routes and external links).

## Changes

### 1. Add new routes for external pages (`src/App.tsx`)
- Add three new routes: `/external/teamdino`, `/external/feedback`, `/external/coffee`
- Each route renders a new `ExternalPage` component that displays the target URL in a full-height iframe

### 2. Create `src/components/ExternalPage.tsx` (new file)
- Accepts a `url` prop
- Renders a full-height `<iframe>` that fills the space between the navbar and footer
- Uses `w-full` and calculated height (`calc(100vh - navbar - footer)`) to maximize the visible area

### 3. Update `src/components/Navbar.tsx`
- Convert external links from `<a>` tags to React Router `<NavLink>` components pointing to the new `/external/*` routes
- Merge all nav items (internal + external) into a single unified list so the `navRefs` array covers all items
- The glowing light bar indicator will now track all items, moving to whichever is active (internal or external)
- On mobile, external items in the hamburger menu also become `<NavLink>` elements

## Technical Details

**Unified nav items structure:**
```text
Index  Label              Route                  Icon
0      Grade Calculator   /                      Calculator
1      Habit Tracker      /habits                CheckSquare
2      TeamDino           /external/teamdino     Globe
3      Feedback           /external/feedback     MessageSquare
4      Buy Me a Coffee    /external/coffee       Coffee
```

**Files created:**
- `src/components/ExternalPage.tsx` -- iframe wrapper component

**Files modified:**
- `src/App.tsx` -- add routes for `/external/teamdino`, `/external/feedback`, `/external/coffee`
- `src/components/Navbar.tsx` -- unify all items into one `navItems` array using `NavLink`, extend light bar to all items

