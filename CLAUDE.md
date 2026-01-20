# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UsBest! is a collaborative advertising platform where viewers can remix advertisements and earn rewards. Built with Next.js 16, React 19, TypeScript, and Supabase for authentication and database.

This is a v0.app-generated project that automatically syncs deployments with this repository. Changes are primarily made through v0.app and pushed here automatically.

## Development Commands

### Package Manager
This project uses **Bun** as its package manager (specified in package.json). Use `bun` instead of `npm` or `yarn`:

```bash
# Install dependencies
bun install

# Development server
bun dev

# Production build
bun run build

# Start production server
bun start

# Lint code
bun run lint
```

### Environment Setup
The project requires Supabase environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

These should be set in `.env.local` (not committed to git).

## Architecture

### Framework & Routing
- **Next.js 16** with App Router (not Pages Router)
- **React 19** with Server Components
- All routes are in `app/` directory using the App Router file-based routing

### Authentication & Database
- **Supabase** for authentication and PostgreSQL database
- Three Supabase client patterns:
  - `lib/supabase/client.ts` - Browser client for client components
  - `lib/supabase/server.ts` - Server client for server components/actions
  - `lib/supabase/middleware.ts` - Middleware client for auth checks
- **Protected routes**: `/post`, `/search`, `/dashboard`, `/product` require authentication (configured in middleware.ts)
- Middleware redirects unauthenticated users to `/auth/login`

### Database Schema
Located in `scripts/*.sql` files. Key tables:
- `profiles` - User profiles (linked to auth.users)
- `ads` - Advertisement content
- `surveys` - Survey content with JSONB questions
- `remixes` - User-created remixes of ads
- `likes` - Polymorphic likes for ads/remixes/surveys
- `comments` - Polymorphic comments
- `reviews` - Product reviews (1-5 star ratings)
- `survey_responses` - Survey response tracking

All tables use Row Level Security (RLS) policies for access control.

### UI Components
- **shadcn/ui** components in `components/ui/` (New York style, with CSS variables)
- Component configuration in `components.json`
- Custom components in `components/`:
  - `bottom-nav.tsx` - Mobile navigation
  - `comment-sheet.tsx` - Comment interface
  - `product-sheet.tsx` - Product details
  - `survey-sheet.tsx` - Survey interface
  - `loading-screen.tsx` - Loading states
  - `theme-provider.tsx` - Theme management

### Styling
- **Tailwind CSS 4** with `@tailwindcss/postcss`
- Custom CSS variables for theming in `app/globals.css`
- Brand colors: Primary (#FA8B7A), Secondary (#FA9C7A)
- Uses `tw-animate-css` for animations
- `cn()` utility in `lib/utils.ts` for className merging (clsx + tailwind-merge)

### Type Safety & Linting
- **TypeScript** with strict mode enabled
- Path aliases: `@/*` maps to root directory
- **ESLint** configured but set to `ignoreDuringBuilds: true` in next.config.mjs
- TypeScript also set to `ignoreBuildErrors: true` (v0.app convention)

### Fonts & Assets
- **Noto Sans JP** (Google Font) - Primary font with weights 400, 500, 700
- **Fugaz One** (via @fontsource) - Accent font
- Adobe Typekit loaded in layout.tsx
- Images set to `unoptimized: true` in next.config.mjs
- Logo and assets in `public/` directory

## Key Patterns

### Supabase Client Usage
```typescript
// In Client Components
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// In Server Components/Actions
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

### Content Types
The platform uses a polymorphic content type system with three types: `'ad'`, `'remix'`, `'survey'`. This is used in likes and comments tables to reference different content types.

### Row Level Security
All database queries automatically respect RLS policies. Users can only:
- View all content (SELECT policies open)
- Insert/update/delete their own content
- Unique constraint on likes prevents duplicate likes

### Survey Structure
Surveys store questions as JSONB arrays. A SQL function `get_survey_results()` aggregates responses for analytics.

## Project-Specific Notes

- This is primarily a Japanese-language application (lang="ja" in layout)
- Landing page (app/page.tsx) shows logo animation then redirects to /home after 2 seconds
- Home page is wrapped in Suspense boundary for loading states
- Auth flow: sign-up at `/auth/sign-up`, login at `/auth/login`
- Search supports content type filtering: `/search/[contentType]/[contentId]`
- Vercel Analytics integrated in root layout

## Database Setup

SQL migration scripts in `scripts/` directory should be run in order:
1. `001_create_tables.sql` - Core schema
2. `002_profile_trigger.sql` - Auto-create profiles
3. `003_seed_data.sql` - Sample data
4. `004_create_storage_bucket.sql` - File storage
5. `005_create_survey_responses.sql` - Survey responses
6. `006_create_survey_results_function.sql` - Analytics function
