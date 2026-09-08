# Civic Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the SIGAP experiment as a product-led Civic Ledger experience inspired by Droppy's narrative clarity, with a live map/report dossier as the signature object.

**Architecture:** First establish one canonical visual system in `globals.css`, shared controls, the header, footer, and the glass primitives. Then replace the homepage's abstract-first opening with a real map/report narrative and apply route-specific first-viewport hierarchy to the existing pages. Business logic, Supabase queries, route contracts, and existing page functionality remain intact; changes are presentational, semantic, and accessibility-focused.

**Tech Stack:** Next.js 16.3, React 19, Tailwind CSS v4, Motion, Leaflet, Recharts, Supabase, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-08-civic-ledger-design.md`

## Global Constraints

- Action Blue is the only interaction color; green, amber, and category colors remain semantic only.
- Solid surfaces are the default; liquid glass is limited to one selected dossier or floating context per viewport.
- The homepage has exactly one visible `h1`.
- UI copy contains no em dash character, raw Markdown markers, fake metrics, or fake testimonials.
- Mobile must reflow at content breakpoints and have zero horizontal overflow at 320px, 375px, 390px, 768px, and 1440px.
- Interactive controls have a minimum 44px hit area, visible focus, and reduced-motion behavior.
- Do not add dependencies.
- Preserve Supabase data access, authentication behavior, route names, and existing domain terminology unless a copy change is required by the spec.

---

### Task 1: Establish The Canonical Visual System

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/ui.tsx`
- Modify: `src/components/eksperimen/kaca.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(utama)/layout.tsx`

**Interfaces:**
- Produces canonical `ap-*` CSS variables and shared component behavior used by every later task.
- Keeps existing exported component names and prop signatures unchanged.

- [ ] **Step 1: Add token definitions and theme ownership**

Add light and `.dark` values for canvas, panel, elevated panel, ink, muted ink, hairline, Action Blue, focus blue, and semantic status colors. Set `color-scheme: light` on `:root` and `color-scheme: dark` on `.dark`. Remove the old green page background as the default while retaining legacy semantic variables needed by untouched domain widgets.

- [ ] **Step 2: Normalize shared controls**

Update `Button`, `Input`, `Textarea`, `Select`, `Card`, `Avatar`, and `Skeleton` to use the canonical tokens, explicit transition properties, `min-h-[44px]` where interactive, and focus styles based on `ap-blue-focus`. Keep `Card` flat and solid. Do not change the public props.

- [ ] **Step 3: Reduce liquid glass to an explicit accent**

Change `KacaKartu` so its default is a solid tokenized surface with no inline shadow. Add an optional `glass?: boolean` prop and only apply backdrop blur/specular styling when `glass` is true. Keep `KacaBar` compact with a restrained frosted treatment. Preserve `KacaPill` behavior but remove decorative shine unless `berkilau` is explicitly true.

- [ ] **Step 4: Fix global shell details**

Make the footer theme-aware, replace visible em dash copy in the footer, align theme color metadata with the active theme strategy, and add root font smoothing, `text-wrap: pretty` for prose, and neutral image outlines.

- [ ] **Step 5: Verify the shared system**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: TypeScript succeeds. ESLint reports no new errors; the pre-existing `gelap` dependency warning is tracked separately.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components/ui.tsx src/components/eksperimen/kaca.tsx src/app/layout.tsx "src/app/(utama)/layout.tsx"
git commit -m "refactor: establish civic ledger visual system"
```

### Task 2: Build The Civic Ledger Product Opening

**Files:**
- Modify: `src/app/(utama)/page.tsx`
- Modify: `src/app/(utama)/landing-visual.tsx`
- Modify: `src/components/eksperimen/hero-pembungkus.tsx`
- Modify: `src/components/eksperimen/hero-gradient.tsx`
- Modify: `src/components/eksperimen/pita-gradient.tsx`

**Interfaces:**
- Keeps `PetaHeroVisual`, `AngkaHidup`, and `Terungkap` exports available to current consumers.
- `PetaHeroVisual` remains driven by `TitikHero[]` and existing Leaflet callbacks.

- [ ] **Step 1: Replace the abstract-first hero composition**

Remove `HeroPembungkus` from the top of the homepage. Make the first section contain one `h1`, concise task-oriented copy, one primary link to `/peta`, and `PetaHeroVisual` as the product artifact. Keep the live Supabase-backed map points and fallback points.

- [ ] **Step 2: Make the dossier the one glass surface**

Pass `glass` to the selected report dossier only. Add a visible `Demo` label when `FALLBACK_TITIK` is active, ensure report titles use `break-words`, and keep the close action at 44px. Add `aria-live="polite"` to the selected report status region without announcing every map movement.

- [ ] **Step 3: Add the report lifecycle rail**

Create a small local component in `landing-visual.tsx` for report lifecycle stages using existing `STATUS` labels. It must render as a horizontal rail from `sm` upward and a stacked list on narrow screens. It is explanatory content, not a fake activity feed, and must not invent user names or timestamps.

- [ ] **Step 4: Reshape the remaining homepage sections**

Replace the equal six-card category block and the three equal solution cards with a lead “Dari laporan ke bukti” section plus three role modules with different compositions. Use existing category counts and real images only. Remove raw Markdown asterisks, decorative all-caps labels, and unsupported claims.

- [ ] **Step 5: Retire repeated gradient ribbons from the homepage**

Keep `HeroGradient` available only for a deliberate fallback or optional visual, but do not render it above the product opening. Make `PitaGradient` default to a static solid section when used by app routes; no continuous shader should run on every data page.

- [ ] **Step 6: Verify the homepage at narrow widths**

Run the local app and inspect the homepage at 320px, 375px, 390px, 768px, and 1440px. Confirm `document.documentElement.scrollWidth === window.innerWidth`, one `h1`, no clipped category names, and no console errors.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(utama)/page.tsx" "src/app/(utama)/landing-visual.tsx" src/components/eksperimen/hero-pembungkus.tsx src/components/eksperimen/hero-gradient.tsx src/components/eksperimen/pita-gradient.tsx
git commit -m "feat: make civic ledger the product opening"
```

### Task 3: Rebuild Shared Navigation And Interaction Semantics

**Files:**
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/modal.tsx`
- Modify: `src/components/command-palette.tsx`
- Modify: `src/components/notifikasi-bel.tsx`
- Modify: `src/components/map/tur-peta.tsx`

**Interfaces:**
- Preserves route links, authentication callbacks, modal props, command palette commands, and notification data.

- [ ] **Step 1: Align header hierarchy**

Use Action Blue for logo action, active links, primary login, and demo button. Keep the header compact at 44px content height on desktop and a labelled mobile menu at the content breakpoint where the nav stops fitting, not blindly at `md`. Add `aria-current="page"` to active links.

- [ ] **Step 2: Correct account disclosure semantics**

Remove the incomplete `role="menu"` pattern, use a labelled disclosure list, and preserve Escape close plus focus return. Ensure the account panel is keyboard reachable without relying on hover.

- [ ] **Step 3: Harden dialog and palette focus behavior**

Centralize close behavior for modal, notification, map tour, and command palette. Move focus into the opened surface, restore it on every close path, set `aria-modal`, contain overscroll, and use a keyboard-operable backdrop strategy. Add 44px result rows and safe-area-aware fixed offsets.

- [ ] **Step 4: Verify interactions**

Keyboard-test Tab, Shift+Tab, Enter, Space, and Escape for the header menu, account panel, command palette, demo modal, notification popover, and map tour. Confirm no focus lands on an unmounted element.

- [ ] **Step 5: Commit**

```bash
git add src/components/site-header.tsx src/components/modal.tsx src/components/command-palette.tsx src/components/notifikasi-bel.tsx src/components/map/tur-peta.tsx
git commit -m "fix: make shared navigation and dialogs accessible"
```

### Task 4: Make Route First Viewports Product-Specific

**Files:**
- Modify: `src/app/(utama)/peta/page.tsx`
- Modify: `src/components/map/jelajah.tsx`
- Modify: `src/app/(utama)/laporan-saya/page.tsx`
- Modify: `src/app/(utama)/laporan-saya/gerbang-laporan-saya.tsx`
- Modify: `src/app/(utama)/papan-skor/page.tsx`
- Modify: `src/app/(utama)/transparansi/page.tsx`
- Modify: `src/app/(utama)/transparansi/grafik.tsx`
- Modify: `src/app/(utama)/demo/page.tsx`
- Modify: `src/app/(utama)/dewan/dewan-klien.tsx`
- Modify: `src/app/(utama)/dewan/gerbang-dewan.tsx`
- Modify: `src/app/(utama)/masuk/page.tsx`

**Interfaces:**
- Preserves page props, server data queries, auth gates, charts, map controls, and existing action handlers.

- [ ] **Step 1: Make `/peta` map-first**

Replace the tall ribbon opening with a compact page header and a map-first layout. Condense filters into a toolbar on desktop and a reflowing control group on mobile. Add `min-w-0`, safe-area padding, and a keyboard-visible selected report state.

- [ ] **Step 2: Preserve private-route context**

Update `proxy.ts` and the two route gates so redirects include a human-readable destination context from `next`. The login page must show whether the user is continuing to “Laporan Saya” or “Dashboard Dewan”, without exposing unsafe query text as HTML.

- [ ] **Step 3: Reorder `/laporan-saya` and `/dewan` around work**

Put the personal timeline and overdue action queue before supporting stats/charts. Use solid surfaces and one selected contextual overlay only. Add autosave status/live feedback to the Dewan assignment control and an accessible label to the heatmap switch.

- [ ] **Step 4: Fix `/papan-skor` mobile composition**

Use a first-place lead card plus a two-item secondary row below the narrow breakpoint. Apply `min-w-0` and `break-words` to names and keep rank color semantic.

- [ ] **Step 5: Make `/transparansi` evidence-first**

Lead with the overdue watchlist/accountability statement, then supporting metrics and charts. Keep Open Data available on mobile. Add a text/table equivalent for the charts.

- [ ] **Step 6: Turn `/demo` into an evaluation console**

Present persona selection, task sequence, and proof/result in that order. Reduce repeated glass panels and label demo-only values honestly.

- [ ] **Step 7: Bring `/masuk` above the fold**

Shorten the masthead, place the email/password form first, add `name`, `autocomplete`, correct input types, connected labels, and destination context.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(utama)/peta/page.tsx" "src/components/map/jelajah.tsx" "src/app/(utama)/laporan-saya" "src/app/(utama)/papan-skor" "src/app/(utama)/transparansi" "src/app/(utama)/demo" "src/app/(utama)/dewan" "src/app/(utama)/masuk/page.tsx" src/proxy.ts
git commit -m "feat: prioritize route workflows in the experiment"
```

### Task 5: Close Responsive, Accessibility, And Content Gaps

**Files:**
- Modify: `src/components/map/leaflet-map.tsx`
- Modify: `src/components/map/buat-laporan.tsx`
- Modify: `src/components/map/form-fasilitas.tsx`
- Modify: `src/components/map/tombol-ikuti-area.tsx`
- Modify: `src/app/(utama)/laporan/[id]/page.tsx`
- Modify: `src/app/(utama)/laporan/[id]/komentar.tsx`
- Modify: `src/app/(utama)/laporan/[id]/sebelum-sesudah.tsx`
- Modify: `src/app/(utama)/laporan/[id]/share-buttons.tsx`
- Modify: `src/app/(utama)/daftar/page.tsx`
- Modify: `src/app/(utama)/edukasi/edukasi-klien.tsx`
- Modify: `src/lib/utils.ts`

**Interfaces:**
- Preserves report submission, comment submission, navigation, and date formatting outcomes.

- [ ] **Step 1: Fix touch and safe-area behavior**

Give Leaflet controls and interactive markers safe-area-aware offsets and 44px hit areas while keeping visible marker artwork compact. Add scroll padding for fixed command controls and embed overlays.

- [ ] **Step 2: Complete form semantics**

Add `name`, `autocomplete`, labels, `aria-describedby`, and linked error/live regions to login, registration, report, facility, and comment forms. Use links for navigation rather than buttons that call `router.push` where no mutation occurs.

- [ ] **Step 3: Complete map semantics**

Expose interactive markers as named controls, disable keyboard focus for decorative markers, and associate map instructions/errors with the correct fieldset or labelled region.

- [ ] **Step 4: Complete media and dynamic feedback**

Add explicit image dimensions and lazy loading where appropriate, announce clipboard/report/notification changes, and surface comment/autosave errors instead of discarding them.

- [ ] **Step 5: Remove remaining guideline violations**

Replace `transition-all`, visible `...`, direct date formatting, nested Link/Button controls, and any raw Markdown markers found by the audit. Use `Intl.DateTimeFormat` and `Intl.NumberFormat` where displayed values are formatted.

- [ ] **Step 6: Commit**

```bash
git add src/components/map src/app/(utama)/laporan src/app/(utama)/daftar/page.tsx src/app/(utama)/edukasi/edukasi-klien.tsx src/lib/utils.ts
git commit -m "fix: finish civic ledger responsive and a11y pass"
```

### Task 6: Verify, Review, And Deploy The Experiment

**Files:**
- Verify: all changed files and routes
- Modify: only files required by verification findings

- [ ] **Step 1: Run static verification**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all commands exit 0. Any remaining warning must be named with its file and line.

- [ ] **Step 2: Run browser smoke checks**

Start the production build locally and inspect `/`, `/peta`, `/laporan-saya`, `/papan-skor`, `/transparansi`, `/demo`, `/dewan`, and `/masuk` in light and dark at 375px, 768px, and 1440px. Record screenshots and verify there are no critical console errors or failed first-party requests.

- [ ] **Step 3: Run interaction and accessibility checks**

Keyboard-test shared navigation, map dossier, dialogs, login form, report links, and the mobile menu. Run an axe-equivalent audit where available and manually verify heading order, focus visibility, chart alternatives, and live status announcements.

- [ ] **Step 4: Run anti-slop delivery gate**

Check the core purpose test, the UI checklist, the mobile checklist, and the copy rules. Specifically confirm no more than one glass focal surface per viewport, no decorative repeated gradients, no fake data claims, no horizontal overflow, and no em dash in visible UI copy.

- [ ] **Step 5: Fix verification findings and rerun the complete gate**

Do not deploy from a partial verification run. Repeat TypeScript, lint, build, route screenshots, and keyboard checks after every verification fix.

- [ ] **Step 6: Deploy the experiment**

```bash
git status --short
git push origin eksperimen/visual-fusion
vercel --prod
```

Verify the deployed experiment URL again with the same route matrix and report the commit SHA, deployment URL, screenshots, and any residual warning.
