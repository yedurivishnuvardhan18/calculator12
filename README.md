# GITAM Grade Calculator

TeamDino's GITAM Grade Calculator helps students calculate semester grades, SGPA, and CGPA. The production website is [calculator.teamdino.in](https://calculator.teamdino.in/).

## Features

- Calculate semester grade points and SGPA from course grades and credits.
- Calculate CGPA using a previous CGPA and earned credits.
- Explore what-if CGPA scenarios and attendance tools.
- Browse GITAM learning materials and results tools.
- Use optional AI-generated grade feedback and Telugu grade roasts when the Supabase AI function is configured.

## Technology

- React 18, TypeScript, and Vite
- React Router, Tailwind CSS, and shadcn/ui
- Supabase client and Edge Functions
- Vite PWA plugin

## Requirements

- Node.js 18 or later
- npm
- Supabase project credentials for features that use Supabase

## Local development

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Create a local `.env` file and configure the Supabase client values:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production build in `dist/` |
| `npm run build:dev` | Create a development-mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest test suite |

## Supabase and AI feedback

The app's AI feedback and roast features call the `ai-feedback` Supabase Edge Function. Deploy it with the Supabase CLI after linking your project:

```sh
supabase functions deploy ai-feedback
```

Configure these secrets for the Edge Function. The AI service must expose an OpenAI-compatible chat completions endpoint:

```sh
supabase secrets set AI_API_URL=https://YOUR_AI_PROVIDER/v1/chat/completions
supabase secrets set AI_API_KEY=YOUR_AI_API_KEY
supabase secrets set AI_MODEL=YOUR_MODEL_NAME
```

Keep the AI API key in Supabase secrets; do not put it in a `VITE_` variable or commit it to source control. The app can still be built without the AI function, but requests to those optional features require the function and provider configuration.

The `gitam-proxy` Edge Function is used for GITAM results and attendance integrations and has its own Supabase configuration.

## Attendance screenshot import

The Attendance Calculator can import class counts from a screenshot using the `attendance-screenshot` Supabase Edge Function. Configure a rotated OpenRouter API key as a server-side secret, then deploy the function:

```sh
supabase secrets set OPENROUTER_API_KEY=YOUR_ROTATED_OPENROUTER_API_KEY
supabase functions deploy attendance-screenshot
```

The function defaults to the `google/gemini-2.5-flash` vision model. Set `OPENROUTER_MODEL` as a Supabase secret to use a different OpenRouter vision model. Never put the OpenRouter key in a `VITE_` variable or client-side code. The function accepts image uploads without a user login, limits image size and applies a per-instance request-frequency limit, and sends the image to OpenRouter for analysis. The request limit is best-effort, not a distributed abuse-prevention boundary; set suitable spending limits for the OpenRouter key.

## Deployment

Build the static site with `npm run build` and deploy the contents of `dist/` to the configured hosting provider. Configure the host to serve `index.html` as the fallback for client-side routes. Supabase Edge Functions are deployed separately.

## SEO files

- `public/robots.txt` controls crawler guidance and advertises the sitemap.
- `public/sitemap.xml` lists the public pages intended for indexing.
- The production canonical domain is `https://calculator.teamdino.in/`.
