# SIGAP

**Lapor. Serentak. Selesai.**

SIGAP adalah portal pelaporan masalah permukiman berbasis peta untuk warga dan pemerintah desa/kelurahan. Warga memetakan masalah lingkungan sekitar dalam beberapa klik, sementara dewan memantau serta menindaklanjuti setiap laporan sampai tuntas — semua terlacak dalam satu papan.

`Next.js 16 · Supabase · Leaflet · Tailwind v4`

## Fitur Utama

- **Peta interaktif dengan cluster** — ribuan titik laporan tetap ringan berkat marker clustering.
- **Lapor pin-drop + foto** — klik lokasi di peta, isi judul/deskripsi, unggah foto bukti.
- **Vote & komentar realtime** — dukung laporan warga lain dan ikut diskusi secara live.
- **Gamifikasi** — poin, badge, dan leaderboard untuk menggerakkan partisipasi warga.
- **Dashboard dewan + heatmap** — admin melihat distribusi masalah dan memperbarui status laporan.
- **Mode gelap** — nyaman dipakai siang maupun malam.

## Setup

Prasyarat: **Node 20+** dan **npm**.

1. Buat proyek gratis di [supabase.com](https://supabase.com).
2. Isi `.env.local` dari Project Settings → API (contoh format ada di `.env.local.example`):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://PROJECT-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ISI-ANON-KEY-DISINI
   SUPABASE_SERVICE_ROLE_KEY=ISI-SERVICE-ROLE-KEY
   ```

3. Buka **SQL Editor**, jalankan isi `supabase/schema.sql`.
4. Buat akun demo: `node scripts/buat-user-demo.mjs` (butuh `SUPABASE_SERVICE_ROLE_KEY`
   di `.env.local`; bisa juga manual lewat Dashboard → Authentication → Add user,
   email `@sigap.demo`, sandi `sigap123456`).
5. Masih di SQL Editor, jalankan isi `supabase/seed.sql`.
6. Pasang dependensi dan jalankan:

   ```bash
   npm install
   npm run dev
   ```

7. Buka http://localhost:3000

## Akun Demo

Semua akun demo memakai sandi: `sigap123456`

| Nama               | Email                | Peran |
| ------------------ | -------------------- | ----- |
| Budi Santoso       | budi@sigap.demo      | Warga |
| Sari Melati        | sari@sigap.demo      | Warga |
| Agus Pratama       | agus@sigap.demo      | Warga |
| Dewi Kartika       | dewi@sigap.demo      | Warga |
| Rafa Alfarizi      | rafa@sigap.demo      | Warga |
| Dewan Kota Harapan | dewan@sigap.demo     | Admin |

Promosi admin manual (jalankan di SQL Editor):

```sql
UPDATE profiles SET role='admin' WHERE username='<username>';
```

## Deploy ke Vercel

1. Push repositori ini ke GitHub.
2. Import proyek di [vercel.com](https://vercel.com).
3. Set environment variable `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.

Catatan: jika memakai Google OAuth, tambahkan redirect URL Vercel (`https://<domain>/auth/callback`) ke konfigurasi Auth di Supabase. Tanpa OAuth (login email/sandi), langkah ini opsional.

## Struktur Proyek

```
sigap/
├── src/
│   ├── app/                  # Halaman & route (App Router)
│   └── components/
│       └── map/              # Komponen peta Leaflet & cluster
└── supabase/
    ├── schema.sql            # Skema database (jalankan pertama)
    └── seed.sql              # Data demo (jalankan kedua)
```

## Checklist Lomba Infinitera 2.0

- [ ] Sudah deployed (Vercel)
- [ ] Repo publik di GitHub
- [ ] Video demo 5–7 menit
- [ ] Proposal PDF
- [ ] Akun demo juri aktif

## Kredit Data

Referensi data persampahan dan riset permukiman: SIPSN KLHK 2024–2025, BRIN.
