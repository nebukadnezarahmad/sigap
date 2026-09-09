# SIGAP Apple HIG Fase 4 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Terapkan seluruh prinsip Apple yang relevan untuk web (HIG Foundations + Components, Design Resources, SF Symbols) ke SIGAP tanpa meniru iOS secara literal.

**Architecture:** Fondasi dulu (tes → token → primitif → motion), lalu tiga workstream paralel (dialog/navigasi; loading+data-truth; feedback+copy+ikon), lalu verifikasi akhir + QA preview.

**Tech Stack:** Next.js 16.3.2 App Router, React 19, Tailwind v4, motion/react, Lucide, Supabase, Vitest + Testing Library.

**Spec:** Percakapan Fase 4 (motion subtle Apple murni; foto hanya 3 eksisting di homepage/social proof; biru #0066cc; hijau hanya data/status).

## Global Constraints

- Branch: `eksperimen/apple-droppy-biru`. Jangan sentuh `main`/production.
- Next.js 16 bukan Next.js lama: baca `node_modules/next/dist/docs/` sebelum perubahan API/struktur (loading/error/fonts). Patuhi deprecation.
- SF Pro/SF Symbols tidak boleh disalin/dijadikan webfont (lisensi mockup). Poppins tetap identitas; `-apple-system` di depan stack.
- Jangan install dependency baru kecuali agen fondasi (satu `npm install` saja).
- Jangan push; hanya commit lokal. Verifikasi tiap checkpoint: `npm run test -- --run`, `npm run lint`, `npx tsc --noEmit`.
- Jangan edit `.claude/worktrees/redesign-2026` (worktree terpisah, abaikan).
- QA boleh memakai data Supabase aktif (`.env.local` tersedia).

---

### Task 1: Fondasi pengujian

**Files:**
- Modify: `package.json` (script `test`, devDeps)
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/components/__tests__/ui.test.tsx`, `src/components/__tests__/modal.test.tsx`, `src/components/__tests__/feedback-state.test.tsx`, `src/components/__tests__/search-field.test.tsx`, `src/lib/__tests__/use-theme.test.tsx`, `src/lib/__tests__/motion.test.ts`

**Interfaces:**
- Consumes: tidak ada.
- Produces: `npm run test -- --run` hijau; harness dipakai Task 3–5 untuk regression test.

- [ ] **Step 1: Install devDeps** — `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom axe-core`. Satu-satunya instalasi di seluruh plan.
- [ ] **Step 2: Tulis vitest.config.ts + setup.ts** — environment jsdom, setupFiles jest-dom + cleanup otomatis.
- [ ] **Step 3: Tulis baseline test** — Button (render, disabled, loading), Modal (Escape tutup, focus trap, restore fokus), FeedbackState/SearchField (setelah Task 3 dibuat, tambah test-nya di Task 3; di sini cukup Button/Modal/theme/motion tokens).
- [ ] **Step 4: Verifikasi** — `npm run test -- --run` PASS; `npx tsc --noEmit` PASS.
- [ ] **Step 5: Commit** — `test: add UI behavior and accessibility harness`.

---

### Task 2: Token visual

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/use-theme.ts`, `src/lib/constants.ts`, `src/app/manifest.ts`, `public/ikon.svg`

**Interfaces:**
- Consumes: tidak ada.
- Produces: token `--on-action`, `--success/--warning/--danger` (+varian dark), `--bg-elevated`, `--glass`, shadow, safe-area utility, durasi/easing yang dipakai Task 3–4.

- [ ] **Step 1: Tambah token ke globals.css** — on-action, status, elevated, glass, safe-area, duration/easing; pertahankan token lama.
- [ ] **Step 2: Perbaiki dark-mode** — tombol `bg-action text-white` di dark harus kontras (pakai on-action); success/danger varian dark; forced-colors (`forced-color-adjust`, `ButtonFace`).
- [ ] **Step 3: Font stack** — Poppins utama + `-apple-system, BlinkMacSystemFont, system-ui` di depan fallback; hapus Fraunces yang tak terpakai.
- [ ] **Step 4: Manifest + ikon** — `theme_color #0066cc`, `background_color #f5f5f7`; selaraskan `ikon.svg` ke biru.
- [ ] **Step 5: use-theme + constants** — sinkronisasi theme-color meta dengan override user; pisahkan warna data dari token UI-state.
- [ ] **Step 6: Verifikasi + commit** — test/lint/tsc PASS; `style: complete semantic Apple-inspired design tokens`.

---

### Task 3: Primitive HIG (butuh Task 1–2)

**Files:**
- Modify: `src/components/ui.tsx`
- Create: `src/components/feedback-state.tsx`, `src/components/progress.tsx`, `src/components/search-field.tsx`, plus test tiap komponen baru.

**Interfaces:**
- Consumes: token Task 2.
- Produces: `Button` (44px min, loading+label aksi, spinner), `IconButton` (nama aksesibel wajib), `Skeleton` (varian), `Progress` (role=progressbar), `FeedbackState` (empty/no-results/error/offline), `SearchField` — dipakai Task 6–8.

- [ ] **Step 1–4:** Tulis komponen + test (red-green) + verifikasi + commit `feat: add HIG-aligned UI primitives`.

---

### Task 4: Motion subtle Apple (butuh Task 2)

**Files:**
- Create: `src/lib/motion.ts`
- Modify: `src/components/gerak.tsx`, `src/app/globals.css`, semua pemakai `motion/react` (modal, command-palette, notifikasi-bel, tur-peta, jelajah, landing-visual, badge-saya, *-klien.tsx, vote/komentar/konfirmasi/momen-selesai).

**Interfaces:**
- Consumes: token durasi Task 2.
- Produces: token motion bersama; tidak ada literal spring tersebar.

Standar: hover/press 150–180ms; fade/icon-replace 180–220ms; popover 180–240ms; modal/sheet 280–320ms; scroll-reveal 450–550ms sekali. Confetti/map/pulse/smooth-scroll menghormati reduced-motion (dissolve saja). Perbaiki warning `gelap` di `leaflet-map.tsx:254`.

- [ ] **Step 1–4:** Ganti literal → token; test reduced-motion; verifikasi; commit `refactor: standardize subtle Apple motion`.

---

### Task 5: Modal/sheet + navigasi + safe-area

**Files:**
- Modify: `src/components/modal.tsx`, `src/components/site-header.tsx`, `src/components/command-palette.tsx`, `src/components/notifikasi-bel.tsx`, `src/components/map/tur-peta.tsx`, `src/components/map/jelajah.tsx`, `src/app/globals.css`

Sheet mobile (grabber, dvh, safe-area), drag-dismiss hanya untuk sheet aman (form kotor → konfirmasi). Keyboard nav + focus restore + `aria-current` + glass terbatas navigasi + fallback opaque.

- [ ] Verifikasi + commit `feat: unify dialogs navigation and safe areas`.

---

### Task 6: Loading/error boundaries + kebenaran data

**Files:**
- Create: `src/app/(utama)/loading.tsx`, `loading.tsx` peta/laporan-[id]/dewan, `src/app/(utama)/error.tsx`, `src/app/global-error.tsx`
- Modify: `src/components/layout-konten.tsx` (copy GalatMuatUlang: "Data belum dapat dimuat…", tanpa jargon Supabase), semua route server (layanan, pasar, umkm, aksi, polling, laporan-saya, warga, laporan-[id], dewan, transparansi, peta, edukasi, embed, api/open-data).

Gunakan prop `retry` (Next 16.3.2: `retry` stabil). Pisahkan loading/empty/error/404. Error query → error state, bukan array kosong/nol/demo/sukses palsu. Demo homepage hanya saat mode demo.

- [ ] Verifikasi + commit `feat: add truthful route loading and error boundaries` + `fix: separate data failures from empty content`.

---

### Task 7: State & feedback mutations

**Files:** komponen client peta, layanan, polling, pasar, umkm, aksi, dewan, edukasi, laporan-[id], notifikasi-bel, tombol-ikuti-area.

`FeedbackState` di semua empty/no-results/error. Mutation: label progres spesifik, disabled, aria-live, sukses hanya pasca-backend, rollback + pesan saat gagal, CTA login yang bisa diklik.

- [ ] Verifikasi + commit `feat: complete loading empty and mutation feedback`.

---

### Task 8: Copy Indonesia + a11y + ikon/foto

**Files:** copy publik (header, jelajah, auth, transparansi, dewan, demo+glosarium, edukasi, laporan), `src/lib/ikon-vektor.tsx`, ikon teks (`■`/`+`/✓ → Lucide), alt foto, `sebelum-sesudah.tsx`, opengraph-image, dedup `foto_url` vs `report_photos`.

Standar: kamu/-mu konsisten, sentence case, kuis/lencana/saringan/langsung/batas waktu layanan (SLA)/pilih (bukan klik). Target 44px, chart text-equivalent, switch heatmap berlabel, tab/panel map, tanpa anchor-button nesting.

- [ ] Verifikasi + commit `fix: standardize Indonesian copy and accessibility` + `style: refine imagery icons and report evidence`.

---

### Task 9: Verifikasi akhir + QA

- [ ] `npm run test -- --run`, `npm run lint` (0 error 0 warning), `npx tsc --noEmit`, `npm run build`, `git diff --check`.
- [ ] Screenshot 390×844, tablet, 1440×900 light/dark; keyboard walkthrough; reduced-motion; kontras 4.5:1/3:1.
- [ ] Push branch + catat URL preview Vercel. Production tidak disentuh.

## Self-Review

- Spec coverage: motion (Task 4) ✓; skeleton (Task 3+6) ✓; empty (Task 3+7) ✓; foto bukti (Task 8) ✓; microcopy (Task 8) ✓; HIG foundations/components/resources/SF Symbols (Task 2–5+8) ✓.
- Tidak ada placeholder: setiap task menyebut file eksak + kontrak + perintah verifikasi.
- Konsistensi tipe: `retry` (bukan `reset`) sesuai Next 16.3.2; `FeedbackState`/`Progress`/`SearchField` diekspor dari path final.
