

# Convert GITAM Python Server to Lovable Cloud

## Overview
Convert the Python Flask server (GITAM portal proxy for results and attendance) into a Lovable Cloud edge function and build a React page matching the provided HTML design.

## Architecture

```text
+------------------+       +---------------------+       +-------------------+
| React Page       | ----> | Edge Function        | ----> | glearn.gitam.edu  |
| /gitam-results   |       | gitam-proxy          |       | (Results/ATD API) |
+------------------+       +---------------------+       +-------------------+
                                    |
                                    v
                           +------------------+
                           | Supabase Table   |
                           | gitam_cache      |
                           +------------------+
```

## Step 1: Database - Create cache table

Create a `gitam_cache` table to replace the Python SQLite cache:
- `key` (text, primary key) - cache key like `marks:REG` or `atd:REG`
- `payload` (jsonb) - cached JSON data
- `fetched_at` (timestamptz) - when cached
- `ttl_seconds` (integer, default 604800) - TTL in seconds

No RLS needed since this is only accessed from the edge function via service role.

## Step 2: Edge Function - `gitam-proxy`

Create `supabase/functions/gitam-proxy/index.ts` that handles two POST routes:

- **`/results`** - accepts `{ reg, sem }`, fetches from `glearn.gitam.edu/Student/getsemmarksdata`, filters by semester, caches results
- **`/attendance`** - accepts `{ reg }`, fetches from `getsubject` and `getoverallatd` endpoints, computes summary stats, caches results

Key differences from Python:
- Uses `GITAM_SESSION_COOKIE` secret (already configured) instead of hardcoded cookie
- Uses Supabase table for caching instead of SQLite
- Uses Deno's built-in fetch instead of `requests`
- HTML parsing for attendance params uses regex (no BeautifulSoup needed since we primarily use the JSON API endpoints)
- CORS headers included for browser calls

## Step 3: React Page - `/gitam-results`

Create `src/pages/GitamResults.tsx` with the dark theme UI matching the provided HTML:

- **Tabs**: Results and Attendance toggle
- **Results tab**: Registration number input, semester pill selector (1-8), search button, displays student banner with SGPA/CGPA, semester grades table, internal marks grid
- **Attendance tab**: Registration number input, search button, displays summary stats (average %, subjects below 75%, safe count), subject-wise attendance bars with color-coded status
- Grade badges with color coding (O, A+, A, B+, B, C, F)
- Responsive mobile layout

## Step 4: Add route and nav entry

- Add `/gitam-results` route in `App.tsx`
- Add "GITAM Portal" nav item in `Navbar.tsx` with a `GraduationCap` icon

## Technical Details

- The edge function reads the `GITAM_SESSION_COOKIE` secret which is already configured
- Cache TTL: 7 days for marks, 15 minutes for attendance (matching Python logic)
- The page uses the existing dark theme variables from `index.css` plus custom styling for the GITAM-specific color scheme
- Error handling for expired sessions displays a user-friendly message
- The `filter_by_sem` logic (best grade selection, sessional vs semester detection) is ported directly from Python

