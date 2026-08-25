-- ============================================================
-- SIGAP seed v5 — pasar ReUse, layanan penting, UMKM demo.
-- Idempotent. Jalankan setelah migrasi-v5.sql.
-- ============================================================

-- ---------- barang bekas demo ----------
insert into public.pasar_barang (user_id, judul, deskripsi, kategori, kondisi, titik_ambil, status, claimed_by)
select
  (select id from public.profiles where username = v.pemilik),
  v.judul, v.deskripsi, v.kategori, v.kondisi, v.titik,
  case when v.klaim is null then 'tersedia' else 'terklaim' end,
  (select id from public.profiles where username = v.klaim)
from (values
  ('budi_s', 'Kipas angin berdiri merek Cosmos',
   'Masih kencang dan putih bersih. Kabel utuh, tidak berbunyi. Sisa pemakaian 1 tahun, alasan pindah rumah.',
   'elektronik', 'baik', 'Depan warung Pak Umar, RT 03', null),
  ('sari_m', 'Tumpukan majalah Bobo tahun 2019–2021',
   'Lengkap 24 edisi per tahun. Cocok untuk bacaan perpustakaan kampung atau kerajinan kertas daur ulang.',
   'buku', 'baik', 'Pos ronda RW 07, sore hari', 'dewi_k'),
  ('agus_p', 'Rak sepatu plastik 4 susun',
   'Kurang satu sekrup di tiang tengah tapi masih kokoh dipakai. Sudah kucuci bersih.',
   'mebel', 'cukup', 'Halaman balai RW, pagi hari', null),
  ('dewi_k', 'Jaket hoodie ukuran M warna hitam',
   'Bahan masih tebal, zipper lancar. Jarang dipakai, berganti gaya hidup minim belanja.',
   'pakaian', 'seperti-baru', 'Ambil saat aksi Sabtu Bersih', null),
  ('rafa_a', 'Set perkakas kecil (tang + obeng 6 in 1)',
   'Sekat kotaknya retak tapi isi lengkap. Semoga berguna buat tetangga yang sedang hemat.',
   'lainnya', 'baik', 'Bengkel Rafa, gang belakang masjid', 'budi_s'),
  ('sari_m', 'Botol kaca isi ulang 12 buah',
   'Bersih dan sudah direbus. Pas untuk usaha sambal atau kecap keliling.',
   'lainnya', 'baik', 'Dapur rumah nomor 21, Jl. Melati', null)
) as v(pemilik, judul, deskripsi, kategori, kondisi, titik, klaim)
where not exists (select 1 from public.pasar_barang where judul = v.judul);

-- ---------- direktori layanan penting ----------
insert into public.layanan_penting (nama, kategori, telepon, bisa_wa, alamat, jam_layanan, urutan)
select v.nama, v.kategori, v.telepon, v.wa, v.alamat, v.jam, v.urutan
from (values
  ('Panggilan Darurat Nasional', 'darurat', '112', false, null, '24 jam', 1),
  ('Pemadam Kebakaran (Damkar)', 'darurat', '113', false, 'Pos damkar terdekat', '24 jam', 2),
  ('Kepolisian Sektor', 'keamanan', '110', false, 'Polsek setempat', '24 jam', 3),
  ('PSC 119 — Gawat Darurat Medis', 'kesehatan', '119', false, null, '24 jam', 4),
  ('Puskesmas Kelurahan', 'kesehatan', '(021) 8790 1234', false, 'Jl. Raya Merdeka No. 5', 'Senin–Sabtu 07.30–14.00', 5),
  ('PLN 123 — Listrik Padam/Kerusakan', 'utilitas', '123', false, null, '24 jam', 6),
  ('PDAM — Pipa Bocor & Tagihan', 'utilitas', '(021) 8790 5678', true, 'Kantor cabang timur', 'Senin–Jumat 08.00–16.00', 7),
  ('Dinas Lingkungan — Sampah Menumpuk', 'lingkungan', '(021) 8790 9012', true, null, 'Senin–Sabtu 07.00–17.00', 8),
  ('Bank Sampah Jemput RT 05/09', 'lingkungan', '0813 2200 1188', true, 'Kios bank sampah Melati Jaya', 'Selasa & Jumat 08.00–11.00', 9),
  ('Security RW — Pos Kamling Utama', 'keamanan', '0812 9977 4411', true, 'Pos kamling RW 07', '24 jam', 10)
) as v(nama, kategori, telepon, wa, alamat, jam, urutan)
where not exists (select 1 from public.layanan_penting where nama = v.nama);

-- ---------- UMKM demo ----------
insert into public.umkm (nama, kategori, produk, whatsapp, alamat, jam_buka, verified, owner_id)
select
  v.nama, v.kategori, v.produk, v.wa, v.alamat, v.jam, true,
  (select id from public.profiles where username = v.pemilik)
from (values
  ('Warung Sembako Bu Tuti', 'kuliner', 'Sembako kilatan, lauk prasmanan, kopi robak pagi', '0813 8811 2244', 'Jl. Melati No. 21', '05.30–20.00 WIB', 'dewi_k'),
  ('Ecoprint Nusa', 'kerajinan', 'Kain tas & taplak motif daun jati, pesan custom nama', '0812 7744 9090', 'Gang Mawar II No. 4', '09.00–17.00 WIB', 'sari_m'),
  ('Servis Elektronik Bang Jali', 'jasa', 'Perbaikan kipas, rice cooker, charger laptop — cek gratis', '0857 3311 5566', 'Terpal depan indomaret lama', '08.00–18.00 WIB', 'agus_p'),
  ('Microgreens Kota Hijau', 'pertanian', 'Brokoli & sunflower sprout, panen sesuai pesanan', '0819 6655 7788', 'Greenhouse halaman belakang posyandu', '06.00–10.00 WIB', 'rafa_a'),
  ('Laundry Air Hemat Kiloan', 'jasa', 'Cuci kiloan 3 jam jadi, deterjen ramah lingkungan', '0878 2299 1010', 'Samping musholla Al-Ikhlas', '07.00–21.00 WIB', 'budi_s'),
  ('Bengkel Sepeda Roda Dua', 'jasa', 'Servis ringan, ganti ban, tuning rem — gratis nasihat rute sepeda', '0895 4400 3030', 'Carport rumah nomor 8', '16.00–21.00 WIB', 'agus_p')
) as v(nama, kategori, produk, wa, alamat, jam, pemilik)
where not exists (select 1 from public.umkm where nama = v.nama);
