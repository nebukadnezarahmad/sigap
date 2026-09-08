# Civic Ledger Design Specification

**Status:** Approved for implementation
**Reference:** Droppy product storytelling, adapted to SIGAP's civic workflow
**Scope:** Vercel experiment branch only

## Goal

Make SIGAP feel like a real civic product in use, not an Apple-inspired landing template. The first viewport must show how a public report moves from a point on the map to a visible action and evidence.

## Product Idea

SIGAP is a public civic activity shelf. Every issue has a location, a report, a status, an accountable owner, and evidence of what happened next. The website should make that chain inspectable without requiring a user to understand the system first.

## Design Direction

- **Tone:** calm, precise, civic, observant, and quietly optimistic.
- **Signature object:** a live report dossier attached to a real map point.
- **Narrative shape:** see the issue, inspect the status, understand the action, follow the proof.
- **Typography:** keep Fraunces for distinctive display moments and Poppins for interface text. Do not introduce a third type family.
- **Interaction color:** Action Blue is the only chrome/action color. Green, amber, and category colors remain semantic only.
- **Surface hierarchy:** solid surfaces are the default. Liquid glass is limited to the selected report dossier or one floating context layer per viewport.
- **Motion:** one intentional entrance on the landing page; direct manipulation transitions for map selection, dossier changes, and status updates; all motion must respect reduced motion.

## Homepage Structure

The homepage no longer opens with a full-screen abstract shader hero.

1. **Product opening:** a concise headline, one action, and the live map/report dossier visual in the first viewport.
2. **Report lifecycle:** a horizontal desktop rail and stacked mobile sequence showing report, verification, assignment, and evidence.
3. **Role modules:** three varied modules for Warga, Publik, and Dewan. Use a full-width lead module plus supporting rows, not equal feature cards.
4. **Public proof:** real statistics already returned by Supabase, a category/SLA summary, and one real photographic context block. No invented testimonials or invented activity.
5. **Closing action:** a focused route to the interactive map, with no second competing pitch.

## Route Hierarchy

- `/peta`: map-first. Filters become a compact toolbar; report list and dossier support map exploration.
- `/laporan-saya`: personal timeline first. The unauthenticated gate preserves the destination context.
- `/papan-skor`: podium and contribution history first. The podium reflows to one plus two on narrow screens.
- `/transparansi`: overdue/accountability watchlist first. Supporting metrics and charts follow.
- `/demo`: evaluation console. Pick a persona, run the task, inspect the proof.
- `/dewan`: action queue first. Map and trends support decisions instead of leading them.
- `/masuk`: login form first. The `next` destination is visible when present.

## Shared System

Add canonical `ap-*` tokens for canvas, surface, ink, muted text, hairline, blue, focus blue, tile dark, and semantic statuses. Correct `color-scheme`, theme-color, footer, input, button, and focus states from those tokens.

Shared components must obey these rules:

- `Button`, `Input`, `Textarea`, and `Select` have 44px minimum interactive height.
- `Button` uses Action Blue for primary actions.
- `Card` is solid and flat by default.
- `KacaKartu` is solid unless an explicit `glass`/floating usage is chosen by the caller.
- `KacaBar` is a compact solid/frosted header, not a heavy glass slab.
- Active navigation uses `aria-current="page"` and Action Blue.
- Account disclosure is a disclosure list, not an incomplete ARIA menu.
- Dialogs restore focus on every close path and contain overscroll.

## Content Rules

- Use direct user language: “Lihat status laporan”, “Pilih peran”, “Tinjau laporan terlambat”.
- Do not use decorative all-caps eyebrows, generic civic-tech language, fake metrics, fake testimonials, or raw Markdown markers in visible copy.
- Do not use the em dash character in UI copy.
- Every demo/fallback datum is visibly labelled as demo data.
- Every section must explain a real workflow or show real evidence.

## Responsive and Accessibility Gates

- Zero horizontal overflow at 320px, 375px, 390px, 768px, and 1440px.
- Mobile is a designed reflow, not a compressed desktop layout.
- All interactive controls have at least 44px hit areas and visible focus.
- Charts have an accessible text/table equivalent.
- Maps distinguish interactive markers from decorative markers and expose keyboard alternatives.
- Forms have labels, names, autocomplete, and linked errors.
- Dialogs and live updates are announced and keyboard-operable.
- Reduced motion removes decorative animation and preserves state changes.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Browser smoke and screenshots for all named routes in light and dark at 375px, 768px, and 1440px.
- No critical console errors, no failed first-party network requests, no horizontal overflow.
- Keyboard pass for header, mobile menu, command palette, map dossier, dialogs, and login form.
