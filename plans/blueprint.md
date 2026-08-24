# Blueprint — SIGAP (Web Lomba Infinitera 2.0 · SDG 11)

**Produk:** SIGAP — Sistem Informasi & Gerak Cepat Aksi Partisipatif.
Platform pelaporan masalah permukiman berbasis peta interaktif: warga melaporkan
(sampah, drainase, lampu jalan, jalan rusak, ruang hijau), saling dukung & berkomentar
secara realtime, mendapat poin & badge, sementara pemerintah desa/kota mengelola laporan
lewat dashboard statistik + heatmap.

**Lomba:** Infinitera 2.0 — Web Development, HM TIF UNISSULA.
Tema: *"Bridging Innovation and Sustainability to Create Meaningful Impact for Future Generations"*.
Subtema dipilih: **SDG 11 — Kota dan Permukiman yang Berkelanjutan**.

## Riset Urgensi (data resmi)

| Fakta | Angka | Sumber |
|---|---|---|
| Timbulan sampah nasional 2024 | ±33,79 juta ton/tahun | SIPSN KLHK via Databoks (14/04/2025) |
| Sampah terkelola baik 2024 | hanya ~32% (37,3 juta t/tahun dilaporkan) | BRIN, rilis SIPSN 2024 |
| Sampah terbuang ke lingkungan 2025 | ±65,5% dari timbulan | GoodStats/SIPSN 2025 |
| Penyumbang terbesar | rumah tangga 56,7% | GoodStats/SIPSN 2025 |

→ Masalah permukiman bersifat **hiperlokal** namun pelaporan warga tersebar di grup WA dan
tidak terlacak. SIGAP menjembatani itu: titik masalah terpetakan, status penanganan transparan,
partisipasi diberi insentif gamifikasi.

## Stack

Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase (Postgres+RLS, Auth email+Google,
Realtime, Storage foto) · Leaflet + markercluster + heat (vanilla, tanpa react-leaflet agar bebas
konflik React 19) · recharts · motion · lucide-react · deploy Vercel.

## Konvensi penting (Next 16)

- `proxy.ts` menggantikan `middleware.ts` (deprecated).
- `cookies()`, `params`, `searchParams` = async (selalu `await`).
- Build default Turbopack; ESLint flat config.

## Skema DB (supabase/schema.sql)

- `profiles(id→auth.users, username, nama_lengkap, avatar_url, role['warga'|'admin'], poin)`
- `categories(id, slug, nama, warna, ikon)` — seed 6 kategori
- `reports(id, user_id, category_id, judul, deskripsi, lokasi geography(point),
   alamat_teks, foto_url, status enum('baru','diverifikasi','dikerjakan','selesai','ditolak'), ts)`
- `comments(id, report_id, user_id, isi, created_at)`
- `votes(report_id, user_id)` PK gabungan
- `user_badges(user_id, badge_key, awarded_at)`
- `report_events(id, report_id, status, catatan, actor_id, created_at)` — riwayat status,
  dibuat otomatis oleh trigger saat `reports.status` berubah.
- Trigger: buat profil otomatis saat signup; poin (+10 lapor, +3 komentar, +1 vote);
  fungsi `check_badges()`; event otomatis saat ganti status.
- RLS aktif semua tabel: baca publik, tulis milik sendiri, ubah status = admin saja
  (`is_admin()` mengecek `profiles.role`). Bucket storage `foto-laporan`: baca publik,
  upload terautentikasi ke folder uid-nya sendiri.

## Langkah konstruksi (urut dependensi)

1. Fondasi: tema token, font, util, konstanta, tipe DB, klien supabase (browser/server/proxy).
2. UI kit lokal (button, card, input, badge, modal, avatar, skeleton) — tanpa dep eksternal.
3. Landing `/`: hero + mini-peta hidup, counter dampak live dari DB, alur 3 langkah, CTA.
4. Auth `/masuk`, `/daftar`, callback OAuth, proxy refresh sesi.
5. Peta `/peta`: Leaflet dinamis (client-only), marker berkategori & cluster, filter,
   daftar laporan sinkron dua arah, drawer detail, modal lapor dengan pin-drop + upload foto.
6. Detail `/laporan/[id]`: galeri foto, vote optimistis, komentar realtime, timeline status.
7. Gamifikasi `/papan-skor`: leaderboard, kartu badge, progres pribadi.
8. Dewan `/dewan` (guard admin): kartu statistik animasi, grafik tren & komposisi,
   tabel kelola status, layer heatmap.
9. Seed demo realistis (kota fiktif "Kota Harapan") + README setup Supabase.
10. Quality gate: lint → typecheck → build → review keamanan (RLS, XSS, input) → smoke test.

## Verifikasi per langkah

- Setiap file TS lolos `npx tsc --noEmit`.
- `npm run lint` bersih, `npm run build` sukses.
- Halaman publik tetap render walau env Supabase belum diisi (guard env + fallback).
- SQL diverifikasi sintaksis manual; RLS policy mengikuti pola Supabase standar.

## Batas lomba yang dipatuhi

Deploy Vercel ✓ · repo GitHub ✓ · akun demo juri ✓ · video demo 5–7 mnt ✓ (tahap lanjut) ·
proposal PDF ✓ (tahap lanjut).
