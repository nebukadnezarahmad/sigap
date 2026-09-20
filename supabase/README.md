# SIGAP — DB Bootstrap (Supabase)

## Canonical fresh-DB path: snapshot-then-migrations

Jalankan berurutan di Supabase Dashboard > SQL Editor:

1. `supabase/schema.sql` — **sekali saja**. Snapshot parsial: base v1
   (profiles, categories, reports, comments, votes, user_badges,
   report_events + RLS + storage + realtime) **plus** salinan V2, V3, V4,
   dan V10 yang sudah di-hardening (`DROP POLICY IF EXISTS` sebelum tiap
   `CREATE POLICY`).
2. `supabase/migrasi-v5.sql`
3. `supabase/migrasi-v6.sql`
4. `supabase/migrasi-v7.sql`
5. `supabase/migrasi-v8.sql`
6. `supabase/migrasi-v9.sql`
7. `supabase/migrasi-v11.sql`
8. Seed (opsional, sesuai kebutuhan): `supabase/seed.sql`,
   lalu `seed-v2.sql`, `seed-v4.sql`, `seed-v5.sql`.

**Lewati `migrasi-v2/v3/v4/v10`** setelah `schema.sql` — isinya sudah
terlipat di dalam snapshot (bagian 16, 17, 18, 22). Menjalankannya lagi
tidak menambah apa-apa dan v2–v4 justru gagal (lihat di bawah).

## Mengapa bukan migrations-only (v2..v11)?

- Tidak ada migrasi base: file `migrasi-v1.sql` **tidak ada** (gap
  penomoran — `schema.sql` berlabel "schema v1" berperan sebagai v1).
  Tanpa `schema.sql`, tabel inti (`profiles`, `reports`, …) tidak ada.
- Klaim "idempotent" di header **v2–v5 tidak terbukti** (verifikasi via
  grep, Sep 2026):
  - `migrasi-v2.sql`: `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE` /
    `DO $$ … duplicate_object` OK, tetapi **11× `create policy` polos**
    tanpa `DROP POLICY IF EXISTS` → error `already exists` saat
    dijalankan ulang.
  - `migrasi-v3.sql`: `create policy "events_update_admin"` polos
    (tanpa guard) → non-idempotent.
  - `migrasi-v4.sql`: 20× `create policy` polos → non-idempotent.
  - `migrasi-v5.sql`: 11× `create policy` polos → non-idempotent.
- Idempotent terverifikasi (aman dijalankan ulang): **v6** (`CREATE OR
  REPLACE` + `DO` block), **v7** (`IF NOT EXISTS` / `DROP IF EXISTS` /
  `CREATE OR REPLACE` / `DO` penangkap `duplicate_object`), **v8**, **v9**,
  **v10**, **v11** (`ON CONFLICT DO UPDATE` + `DROP POLICY IF EXISTS`).
- `schema.sql` sendiri berlabel "Jalankan SEKALI" — snapshot, bukan
  migrasi yang bisa diulang; jangan jadikan acuan idempotency.

## Catatan gap penomoran

- Tidak ada `migrasi-v1.sql`. `schema.sql` ("SIGAP schema v1") adalah
  penggantinya secara de facto. Jangan membuat file v1 retroaktif —
  rujukannya sudah tersebar (header tiap migrasi, kode seed).
- `seed.sql` / `seed-v2/v4/v5.sql` mengikuti versi fitur, bukan versi
  skema; tidak ada `seed-v1/v3.sql` — itu normal, bukan gap.

## Aturan

- **Jangan edit file SQL yang ada.** Perbaikan skema baru wajib file
  migrasi baru (`migrasi-v12.sql`, …) dengan guard idempotency
  (`IF NOT EXISTS` / `DROP … IF EXISTS` / `CREATE OR REPLACE` /
  `DO $$ … duplicate_object`), mengikuti pola v7.
