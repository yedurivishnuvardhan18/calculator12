

# Add GITAM Results Lookup Page

## What You'll Get
A new "Results" page in the app where students can enter their registration number, pick a semester, and instantly see their grade card -- including subject grades, SGPA, CGPA, internal marks, and more.

## How It Works

1. **Backend function** proxies requests to GITAM's servers using a session cookie stored securely as a backend secret
2. **Frontend page** provides a clean, themed UI matching your existing app style -- with registration number input, semester selector, and results display with grade badges, tables, and student info banner
3. **Caching** via a database table so repeated lookups are instant

## Plan

### Step 1: Store the GITAM session cookie as a backend secret
- Use the `add_secret` tool to securely store the `.AspNetCore.Session` cookie value as `GITAM_SESSION_COOKIE`

### Step 2: Create a cache table
- `results_cache` table with columns: `reg` (text, primary key), `payload` (jsonb), `fetched_at` (timestamp)
- No RLS needed since this is only accessed by the backend function

### Step 3: Create backend function `gitam-results`
- Accepts `{ reg, sem }` via POST
- Checks cache table first; if miss, fetches from `glearn.gitam.edu/Student/getsemmarksdata`
- Filters/shapes the response by semester (replicating your Python `filter_by_sem` logic)
- Returns structured JSON with student info, subject grades, SGPA, CGPA, sessional data, internal marks

### Step 4: Create the Results page (`src/pages/Results.tsx`)
- Registration number input field
- Semester pill selector (semesters 1-8)
- Search button with loading state
- Results display:
  - **Student banner** -- name, reg number, SGPA, CGPA, credits
  - **Semester grades table** -- subject name, code, category badge, credits, type, grade badge
  - **Internal marks grid** (if available)
- Error/empty states
- Styled to match the existing pop/playful design system (grade badges, cards, animations)

### Step 5: Add route and navbar entry
- Add `/results` route in `App.tsx`
- Add "Results" nav item with `Search` icon in `Navbar.tsx`

## Technical Details

### Files Created
- `supabase/functions/gitam-results/index.ts` -- edge function with CORS, caching, GITAM API proxy
- `src/pages/Results.tsx` -- full results page component

### Files Modified
- `supabase/config.toml` -- add `[functions.gitam-results]` with `verify_jwt = false` (public endpoint)
- `src/App.tsx` -- add `/results` route
- `src/components/Navbar.tsx` -- add Results nav item

### Database Migration
- Create `results_cache` table for caching GITAM API responses

