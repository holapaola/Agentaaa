# Copilot instructions for AgentAAA

## Build, test, and lint commands

Use `npm` for local commands. The repository contains Bun lockfiles, but the checked-in GitHub Actions workflow uses `npm ci`, `npm run lint`, `npm run test`, and `npm run build`.

- Install dependencies: `npm ci`
- Start the dev server: `npm run dev` (Vite on port `8080`)
- Lint: `npm run lint`
- Run all unit tests: `npm run test`
- Run one test file: `npm run test -- src/test/example.test.ts`
- Watch tests: `npm run test:watch`
- Production build: `npm run build`
- Preview the production build: `npm run preview`

## High-level architecture

This is a client-side Vite + React + TypeScript SPA. The app boots from `src/main.tsx`, mounts `src/App.tsx`, and wires global providers there: `QueryClientProvider`, `TooltipProvider`, toast systems, and `BrowserRouter`.

Routing is defined centrally in `src/App.tsx`. Public routes are `/`, `/auth`, and the payment result pages. `/onboard`, `/dashboard`, and `/mock-checkout` are wrapped in `src/components/ProtectedRoute.tsx`, which relies on `useAuth()` and redirects unauthenticated users to `/auth`.

The app’s main product flow is:
- `src/pages/Auth.tsx` handles sign-in/sign-up with Supabase Auth.
- `src/pages/Onboard.tsx` is a multi-step setup flow that creates or reuses an `agencies` row, then inserts a `clients` row with the brand profile fields used throughout the app.
- `src/pages/Dashboard.tsx` is a tabbed shell rather than nested routes. It swaps dashboard sections like `ContentStudio`, `ClientsHub`, `Overview`, `ContentCalendar`, `AnalyticsHub`, and `Settings` inside one page component.

Supabase is the backend integration point for auth, database, storage, real-time updates, and edge functions. The active frontend client is `src/integrations/supabase/client.ts` and it is auto-generated; do not hand-edit it. Most app code should import `supabase` from there.

Business logic is split between custom hooks and service modules:
- `src/hooks/useAuth.ts` owns current-user state and auth event subscriptions.
- `src/hooks/useSubscription.ts` reads `profiles.subscription_status` / `subscription_plan` and exposes `isActive`.
- `src/hooks/usePipeline.ts` loads clients plus nested posts for the dashboard pipeline and subscribes to Postgres changes on `clients` and `posts`.
- `src/services/*.ts` contains direct Supabase queries and feature logic such as profile lookup, client selection helpers, Stripe checkout redirects, and AI/content generation.

The AI/content workflow is centered in `src/services/agentService.ts` and `src/components/dashboard/ContentStudio.tsx`. `ContentStudio` gathers the prompt/media inputs, uploads media to the `brand-assets` storage bucket when needed, and calls `runContentTask()`. The longer pipeline in `agentService.ts` moves a client through `pipeline_status` states like `Researching`, `Drafting`, `Pending_Approval`, and `Scheduled`, writes generated posts into the `posts` table, and falls back to mock AI responses when `VITE_OPENAI_API_KEY` is not set.

Payments flow through `src/services/stripeService.ts`, which invokes the Supabase Edge Function in `supabase/functions/create-checkout`. Keep plan names aligned with the shared union values (`starter`, `agency`, `enterprise`) on both the frontend and edge-function side.

## Key conventions

- Prefer the `@/` path alias for app imports. It is configured in both `vite.config.ts` and `vitest.config.ts`.
- Reuse the service layer before adding new Supabase queries. `src/services/clientService.ts` and `src/services/profileService.ts` already capture repo-specific access patterns.
- `clientService.ts` intentionally handles schema drift around client lifecycle columns like `deleted_at` and `slot_locked_until`. Keep that compatibility behavior when touching client queries instead of hard-failing on missing columns.
- There are two Supabase client entry points in the repo: the app actively uses `src/integrations/supabase/client.ts` with `VITE_SUPABASE_PUBLISHABLE_KEY`, while `src/services/supabase.ts` is older and still references `VITE_SUPABASE_ANON_KEY`. Follow the imports already used by pages/hooks/services unless you are deliberately consolidating them.
- Shared domain types live in `src/types/index.ts`. Add to those interfaces instead of scattering duplicate inline shapes across pages and components.
- The dashboard is composed as tabs inside `src/pages/Dashboard.tsx`, not route-per-tab. New dashboard sections usually mean adding a component under `src/components/dashboard/` and wiring it into the tab switch there.
- UI primitives come from the generated shadcn/Radix set under `src/components/ui/`. Preserve existing composition patterns and use `cn()` from `src/lib/utils.ts` for class merging.
- Styling relies on Tailwind plus project-specific CSS variables in `src/index.css` (`font-display`, `font-body`, gold-on-dark theme, `glass-card`, `glow-gold`). Reuse those tokens/utilities instead of inventing parallel styling patterns.
- Tests run in Vitest with `jsdom` and shared setup from `src/test/setup.ts`. New tests should follow the existing include pattern `src/**/*.{test,spec}.{ts,tsx}`.
- `npm run lint` currently passes with warnings from some generated UI files. Treat those warnings as existing baseline unless your change touches the file.
