

# Fix: Deploy Edge Functions for Timetable & Attendance Extraction

## Problem
The "extraction failed" error occurs because the backend functions (`extract-timetable` and `extract-attendance`) are not deployed. The frontend code and function code are both correct -- the functions just need to be deployed to make them accessible.

## Solution
Deploy both edge functions. No code changes are required.

## Technical Details
- Deploy `extract-timetable` and `extract-attendance` edge functions
- Both functions are already correctly coded with proper CORS headers and Lovable AI integration
- The `LOVABLE_API_KEY` secret is already configured in the backend
- Once deployed, uploading a timetable or attendance image will trigger AI-powered extraction automatically

