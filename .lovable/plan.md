

# Add TeamDino, Feedback, and Buy Me a Coffee to Navbar

## Overview
Add three new navigation items to the navbar: a link to the TeamDino website, a Feedback form link, and a "Buy Me a Coffee" page link. All three will open in new tabs since they are external URLs.

## Changes

### 1. Update `src/components/Navbar.tsx`
- Add three new items to the nav: **TeamDino** (links to `https://teamdino.in`), **Feedback** (links to the Google Form), and **Buy Me a Coffee** (links to `razorpay.me/@teamdino`)
- These will be rendered as external `<a>` tags (with `target="_blank"`) separate from the internal `NavLink` items, so they won't interfere with the active indicator logic
- Use appropriate icons from lucide-react: `Globe` for TeamDino, `MessageSquare` for Feedback, `Coffee` for Buy Me a Coffee
- On desktop: display them alongside the existing nav items
- On mobile: include them in the hamburger dropdown menu

### Technical Details

**External links to add:**
```text
Label              URL                                                               Icon
TeamDino           https://teamdino.in                                               Globe
Feedback           https://docs.google.com/forms/d/e/1FAIpQLSf.../viewform           MessageSquare
Buy Me a Coffee    https://razorpay.me/@teamdino                                     Coffee
```

**Files modified:**
- `src/components/Navbar.tsx` -- add external link items to both desktop and mobile nav

