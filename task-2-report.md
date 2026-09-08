# Task 2 Report

## Round 1 Fix

- **Critical issue:** `PetaHeroVisual` called `createClient()` before its existing null guard. `createClient()` throws when either public Supabase environment variable is absent, so the fallback rendering path could be interrupted.
- **Fix:** Added an early configuration guard in `src/app/(utama)/landing-visual.tsx` before `createClient()` is called.
- **Configured behavior:** When both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present, the existing Supabase realtime channel and cleanup path are unchanged.
- **Test surface:** No unit/component/browser test framework is configured in this repository. Verification used the focused browser fallback reproduction plus the requested project checks.

## Verification

- `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm dev + Playwright browser fallback`: **PASS**. Fallback report title, visible `Demo` label, and `Siklus laporan` lifecycle rail were all present; `page_errors: []`.
- `npx tsc --noEmit`: **PASS** (exit 0, no output).
- `npm run lint`: **PASS** (0 errors, 1 warning at `src/components/map/leaflet-map.tsx:254`, unrelated to this fix).
- `npm run build`: **PASS** (Next.js 16.3.2 production build completed).
- `git diff --check`: **PASS**.

The browser run also reported existing external map-tile `403` responses and the dev-server HMR WebSocket warning; these did not produce page errors or block the fallback content from rendering.

## Round 2 Fix

- **Critical issue:** `SiteHeader` calls `useUser()`, which called the throwing browser Supabase client factory without checking whether public Supabase configuration existed.
- **Fix:** `useUser()` now derives `supabaseTersedia` from the two public variables, initializes `muat` to `false` when configuration is absent, and skips the auth effect in that case.
- **Configured behavior:** With both variables present, the existing `getUser`, profile lookup, auth-state subscription, and cleanup flow remains unchanged.

## Round 2 Verification

- `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm dev + Playwright browser fallback`: **PASS**. Fallback map report, dossier title, visible `Demo` label, and `Siklus laporan` lifecycle rail were present; `page_errors: []`.
- `npx tsc --noEmit`: **PASS** (exit 0, no output).
- `npm run lint`: **PASS** (0 errors, 1 existing warning at `src/components/map/leaflet-map.tsx:254`).
- `npm run build`: **PASS** (Next.js 16.3.2 production build completed).
