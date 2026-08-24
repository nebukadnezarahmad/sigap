-- ============================================================
-- SIGAP seed v1 — data demo untuk juri.
-- Urutan: 1) schema.sql  2) node scripts/buat-user-demo.mjs
--         3) seed.sql ini.
-- Butuh 6 akun @sigap.demo sudah ada di Auth (dibuat langkah 2);
-- trigger handle_new_user otomatis membuat profiles-nya.
-- Semua blok idempotent (aman dijalankan ulang).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Profiles eksplisit (upsert: set role & poin final)
--    dewan_kota = admin; poin sesuai aktivitas demo
-- ------------------------------------------------------------
insert into public.profiles (id, username, nama_lengkap, role, poin) values
  ((select id from auth.users where email = 'budi@sigap.demo'),  'budi_s',     'Budi Santoso',       'warga', 34),
  ((select id from auth.users where email = 'sari@sigap.demo'),  'sari_m',     'Sari Melati',        'warga', 27),
  ((select id from auth.users where email = 'agus@sigap.demo'),  'agus_p',     'Agus Pratama',       'warga', 15),
  ((select id from auth.users where email = 'dewi@sigap.demo'),  'dewi_k',     'Dewi Kartika',       'warga', 11),
  ((select id from auth.users where email = 'rafa@sigap.demo'),  'rafa_a',     'Rafa Alfarizi',      'warga', 5),
  ((select id from auth.users where email = 'dewan@sigap.demo'), 'dewan_kota', 'Dewan Kota Harapan', 'admin', 0)
on conflict (id) do update
  set username = excluded.username,
      nama_lengkap = excluded.nama_lengkap,
      role = excluded.role,
      poin = excluded.poin;

-- ------------------------------------------------------------
-- 3. 16 laporan di sekitar Jakarta
--    Distribusi status: 6 baru, 3 diverifikasi, 3 dikerjakan,
--    3 selesai, 1 ditolak. Created_at tersebar 13 hari terakhir.
-- ------------------------------------------------------------
insert into public.reports (user_id, category_id, judul, deskripsi, alamat_teks, lokasi, status, created_at)
values
  -- ===== 6 BARU =====
  ((select id from public.profiles where username = 'budi_s'),
   (select id from public.categories where slug = 'sampah'),
   'TPS liar menumpuk di ujung gang warga',
   'Tumpukan sampah rumah tangga sudah lebih dari seminggu tidak diangkut. Bau menyengat dan mulai ada lalat berlipat ganda. Mohon penjadwalan pengangkutan segera.',
   'Gang Melati III RT 04/RW 06, Kel. Sukamaju',
   st_setsrid(st_makepoint(106.8456, -6.2210), 4326)::geography,
   'baru', now() - interval '13 days'),

  ((select id from public.profiles where username = 'sari_m'),
   (select id from public.categories where slug = 'drainase'),
   'Saluran tertutup penuh sampah, air meluap saat hujan',
   'Saluran tertutup di depan deretan ruko tersumbat sampah plastik. Setiap hujan deras lima puluhan menit, air sudah meluap ke jalan dan masuk halaman rumah warga.',
   'Jl. Delima V depan Ruko Blok B2, Kel. Cempaka',
   st_setsrid(st_makepoint(106.8003, -6.1683), 4326)::geography,
   'baru', now() - interval '12 days'),

  ((select id from public.profiles where username = 'agus_p'),
   (select id from public.categories where slug = 'lampu'),
   'Lampu jalan mati total selama dua pekan',
   'Pju di tikungan dekat gang masuk perumahan mati total sudah dua minggu. Jalanan sangat gelap malam hari dan beberapa kali hampir terjadi kecelakaan motor.',
   'Jl. Anggrek Merah tikungan dekat Gang 7, Kel. Mekarsari',
   st_setsrid(st_makepoint(106.8671, -6.2351), 4326)::geography,
   'baru', now() - interval '11 days'),

  ((select id from public.profiles where username = 'dewi_k'),
   (select id from public.categories where slug = 'jalan'),
   'Jalan berlubang besar di depan pintu gerbang SDN 03',
   'Lubang selebar satu meter dengan kedalaman cukup dalam tepat di jalur penyeberangan anak sekolah. Saat hujan lubang tertutup air dan sangat membahayakan pengendara.',
   'Jl. Kenanga No. 12 depan SDN 03, Kel. Ragajaya',
   st_setsrid(st_makepoint(106.7892, -6.2601), 4326)::geography,
   'baru', now() - interval '10 days'),

  ((select id from public.profiles where username = 'rafa_a'),
   (select id from public.categories where slug = 'ruang-hijau'),
   'Taman lingkungan kumuh, rumput tinggi dan bangku rusak',
   'Satu-satunya taman di lingkungan ini kondisinya memprihatinkan: rumput setinggi pinggang, bangku taman patah, dan tempat sampah taman hilang. Anak-anak jadi tak mau main di sana.',
   'Taman Blok C, Jl. Flamboyan Raya, Kel. Pondok Bambu',
   st_setsrid(st_makepoint(106.8210, -6.1950), 4326)::geography,
   'baru', now() - interval '9 days'),

  ((select id from public.profiles where username = 'budi_s'),
   (select id from public.categories where slug = 'lainnya'),
   'Usulan titik bank sampah untuk RT 05 dan RT 07',
   'Warga dua RT ini menumpulkan minyak goreng bekas dan plastik tapi belum ada titik pengumpulan. Kami mengusulkan satu titik bank sampah bersama di area balai RW.',
   'Balai RW 06, Jl. Mawar Indah, Kel. Sukamaju',
   st_setsrid(st_makepoint(106.8533, -6.2087), 4326)::geography,
   'baru', now() - interval '8 days'),

  -- ===== 3 DIVERIFIKASI =====
  ((select id from public.profiles where username = 'sari_m'),
   (select id from public.categories where slug = 'sampah'),
   'Gunungan sampah di bawah jembatan penyeberangan',
   'Sampah dari warung dan pasar dibuang diam-diam di bawah jpo jembatan orang. Volume sudah seperti gunung kecil dan mengganggu pejalan yang menyeberang.',
   'Jpo Jl. Raya Bogor km 24, Kel. Batu Ampar',
   st_setsrid(st_makepoint(106.7956, -6.2278), 4326)::geography,
   'diverifikasi', now() - interval '7 days'),

  ((select id from public.profiles where username = 'agus_p'),
   (select id from public.categories where slug = 'drainase'),
   'Genangan setiap hujan deras di depan musholla',
   'Bak kontrol di depan musholla tersumbat sehingga genangan tinggi lutut saat hujan. Jamaah harus lewat air keruh dan sering terpeleset di area parkir motor.',
   'Jl. Cempaka Putih Tengah depan Musholla Al-Ikhlas',
   st_setsrid(st_makepoint(106.8745, -6.1720), 4326)::geography,
   'diverifikasi', now() - interval '6 days'),

  ((select id from public.profiles where username = 'dewi_k'),
   (select id from public.categories where slug = 'lampu'),
   'Lampu penerangan jalan padam merata sepanjang blok C',
   'Hampir seluruh pju sepanjang blok C padam bersamaan sejak pemadaman listrik pekan lalu, kemungkinan kabel atau mcb cabang rusak. Malam benar-benar gelap gulita.',
   'Jl. Sempur Kaler Blok C1-C8, Kel. Kebon Kacang',
   st_setsrid(st_makepoint(106.8091, -6.2455), 4326)::geography,
   'diverifikasi', now() - interval '5 days'),

  -- ===== 3 DIKERJAKAN =====
  ((select id from public.profiles where username = 'rafa_a'),
   (select id from public.categories where slug = 'jalan'),
   'Aspal berlubang di jalur utama angkot 06',
   'Rangkaian lubang aspal di lajur lambat dilewati angkot dan truk setiap hari. Lubang makin melebar karena tergenang air dari saluran samping yang macet.',
   'Jl. Pahlawan Revolusi lajur lambat arah utara, Kel. Pekayon',
   st_setsrid(st_makepoint(106.8388, -6.1834), 4326)::geography,
   'dikerjakan', now() - interval '4 days'),

  ((select id from public.profiles where username = 'budi_s'),
   (select id from public.categories where slug = 'sampah'),
   'TPS dekat pasar bau menyengat sejak pagi',
   'TPS darurat di sisi pasar induk penuh melebihi kapasitas, sampah tercecer sampai ke badan jalan. Pedagang memohon penambahan armada pengangkutan pagi.',
   'Sisi barat Pasar Induk Kramat Jati, Gerbang 3',
   st_setsrid(st_makepoint(106.7823, -6.2011), 4326)::geography,
   'dikerjakan', now() - interval '3 days'),

  ((select id from public.profiles where username = 'sari_m'),
   (select id from public.categories where slug = 'drainase'),
   'Got tersumbat limbah minyak dari deretan warung',
   'Air got hitam pekat dan berminyak karena warung makan di hulu membuang limbah langsung. Bau busang tercium sampai radius dua ratus meter saat siang.',
   'Parit belakang Jl. Swadaya IV, Kel. Cipinang',
   st_setsrid(st_makepoint(106.8602, -6.2543), 4326)::geography,
   'dikerjakan', now() - interval '3 days'),

  -- ===== 3 SELESAI =====
  ((select id from public.profiles where username = 'agus_p'),
   (select id from public.categories where slug = 'lampu'),
   'Pos kamtib gelap gulita, lampu rusak sejak libur Lebaran',
   'Pos keamanan dan sekitarnya tanpa penerangan membuat jaga malam tidak nyaman. Setelah dilaporkan, kelurahan mengganti lampu dan perbaikan instalasi.',
   'Pos Kamtib RW 03, Jl. Melati Kecil, Kel. Kayu Putih',
   st_setsrid(st_makepoint(106.8265, -6.1522), 4326)::geography,
   'selesai', now() - interval '12 days'),

  ((select id from public.profiles where username = 'dewi_k'),
   (select id from public.categories where slug = 'jalan'),
   'Lubang besar di tikungan dekat posyandu',
   'Lubang besar di tikungan tajam sering mengagetkan pengendara yang baru sadar saat lewat. Sudah ditambal tim pemeliharaan jalan setelah laporan ini naik.',
   'Jl. Balai Pustaka Timur tikungan dekat Posyandu Melati',
   st_setsrid(st_makepoint(106.8890, -6.2180), 4326)::geography,
   'selesai', now() - interval '11 days'),

  ((select id from public.profiles where username = 'rafa_a'),
   (select id from public.categories where slug = 'ruang-hijau'),
   'Taman sekolah butuh revitalisasi dan penghijauan',
   'Halaman sekolah gersang, hanya tanah kering dan satu pohon tua. Usulan revitalisasi disetujui dinas; kini ada bedeng tanaman dan rumput gajah mini.',
   'SDN 05, Halaman timur Jl. Puspa Widuri, Kel. Pulogadung',
   st_setsrid(st_makepoint(106.7748, -6.2390), 4326)::geography,
   'selesai', now() - interval '10 days'),

  -- ===== 1 DITOLAK =====
  ((select id from public.profiles where username = 'budi_s'),
   (select id from public.categories where slug = 'sampah'),
   'Titik sampah di lapangan futsal (duplikat)',
   'Ada sampah berserakan di pinggir lapangan futsal kompleks. Laporan ini sama persis dengan laporan yang sudah berjalan di titik yang sama pekan lalu.',
   'Lapangan futsal Kompleks Olahraga, Jl. Bambu Apus',
   st_setsrid(st_makepoint(106.8420, -6.2705), 4326)::geography,
   'ditolak', now() - interval '30 hours');

-- ------------------------------------------------------------
-- 4. Riwayat report_events untuk laporan non-'baru'
-- ------------------------------------------------------------
insert into public.report_events (report_id, status, catatan, created_at)
values
  -- diverifikasi
  ((select id from public.reports where judul like 'Gunungan sampah%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '6 days'),
  ((select id from public.reports where judul like 'Genangan setiap hujan%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '5 days'),
  ((select id from public.reports where judul like 'Lampu penerangan jalan padam merata%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '4 days'),
  -- dikerjakan
  ((select id from public.reports where judul like 'Aspal berlubang%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '3 days'),
  ((select id from public.reports where judul like 'Aspal berlubang%'),
   'dikerjakan', 'Petugas dinas PU survei dan pasang rambu peringatan.', now() - interval '2 days'),
  ((select id from public.reports where judul like 'TPS dekat pasar%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '2 days'),
  ((select id from public.reports where judul like 'TPS dekat pasar%'),
   'dikerjakan', 'Armada pengangkutan tambahan dijadwalkan besok pagi.', now() - interval '1 day'),
  ((select id from public.reports where judul like 'Got tersumbat limbah%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '36 hours'),
  ((select id from public.reports where judul like 'Got tersumbat limbah%'),
   'dikerjakan', 'Tim jetting drainase dikirim ke lokasi.', now() - interval '18 hours'),
  -- selesai
  ((select id from public.reports where judul like 'Pos kamtib gelap gulita%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '10 days'),
  ((select id from public.reports where judul like 'Pos kamtib gelap gulita%'),
   'dikerjakan', 'Pengadaan lampu diproses oleh kelurahan.', now() - interval '8 days'),
  ((select id from public.reports where judul like 'Pos kamtib gelap gulita%'),
   'selesai', 'Pengerjaan selesai — terima kasih warga.', now() - interval '6 days'),
  ((select id from public.reports where judul like 'Lubang besar di tikungan dekat posyandu%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '9 days'),
  ((select id from public.reports where judul like 'Lubang besar di tikungan dekat posyandu%'),
   'dikerjakan', 'Kontraktor penambalan masuk lokasi.', now() - interval '7 days'),
  ((select id from public.reports where judul like 'Lubang besar di tikungan dekat posyandu%'),
   'selesai', 'Pengerjaan selesai — terima kasih warga.', now() - interval '5 days'),
  ((select id from public.reports where judul like 'Taman sekolah butuh revitalisasi%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '8 days'),
  ((select id from public.reports where judul like 'Taman sekolah butuh revitalisasi%'),
   'dikerjakan', 'Koordinasi dengan pihak sekolah selesai.', now() - interval '6 days'),
  ((select id from public.reports where judul like 'Taman sekolah butuh revitalisasi%'),
   'selesai', 'Revitalisasi rampung, tanaman dirawat rutin.', now() - interval '4 days'),
  -- ditolak
  ((select id from public.reports where judul like 'Titik sampah di lapangan futsal%'),
   'diverifikasi', 'Diverifikasi tim lingkungan kecamatan.', now() - interval '24 hours'),
  ((select id from public.reports where judul like 'Titik sampah di lapangan futsal%'),
   'ditolak', 'Duplikat dari laporan serupa di titik yang sama.', now() - interval '12 hours')
on conflict do nothing;

-- ------------------------------------------------------------
-- 5. Votes antar warga (tanpa duplikat pasangan)
-- ------------------------------------------------------------
insert into public.votes (report_id, user_id)
values
  ((select id from public.reports where judul like 'TPS liar%'),                        (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'TPS liar%'),                        (select id from public.profiles where username = 'agus_p')),
  ((select id from public.reports where judul like 'TPS liar%'),                        (select id from public.profiles where username = 'dewi_k')),
  ((select id from public.reports where judul like 'TPS liar%'),                        (select id from public.profiles where username = 'rafa_a')),
  ((select id from public.reports where judul like 'Saluran tertutup penuh sampah%'),   (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Saluran tertutup penuh sampah%'),   (select id from public.profiles where username = 'agus_p')),
  ((select id from public.reports where judul like 'Saluran tertutup penuh sampah%'),   (select id from public.profiles where username = 'rafa_a')),
  ((select id from public.reports where judul like 'Lampu jalan mati total%'),          (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Lampu jalan mati total%'),          (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'Lampu jalan mati total%'),          (select id from public.profiles where username = 'dewi_k')),
  ((select id from public.reports where judul like 'Jalan berlubang besar%'),           (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Jalan berlubang besar%'),           (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'Jalan berlubang besar%'),           (select id from public.profiles where username = 'agus_p')),
  ((select id from public.reports where judul like 'Taman lingkungan kumuh%'),          (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'Taman lingkungan kumuh%'),          (select id from public.profiles where username = 'dewi_k')),
  ((select id from public.reports where judul like 'Usulan titik bank sampah%'),        (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'Usulan titik bank sampah%'),        (select id from public.profiles where username = 'dewi_k')),
  ((select id from public.reports where judul like 'Usulan titik bank sampah%'),        (select id from public.profiles where username = 'rafa_a')),
  ((select id from public.reports where judul like 'Gunungan sampah%'),                 (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Gunungan sampah%'),                 (select id from public.profiles where username = 'agus_p')),
  ((select id from public.reports where judul like 'Gunungan sampah%'),                 (select id from public.profiles where username = 'dewi_k')),
  ((select id from public.reports where judul like 'Gunungan sampah%'),                 (select id from public.profiles where username = 'rafa_a')),
  ((select id from public.reports where judul like 'Genangan setiap hujan%'),           (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Genangan setiap hujan%'),           (select id from public.profiles where username = 'dewi_k')),
  ((select id from public.reports where judul like 'Lampu penerangan jalan padam merata%'), (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Lampu penerangan jalan padam merata%'), (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'Lampu penerangan jalan padam merata%'), (select id from public.profiles where username = 'agus_p')),
  ((select id from public.reports where judul like 'Aspal berlubang%'),                 (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Aspal berlubang%'),                 (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'Aspal berlubang%'),                 (select id from public.profiles where username = 'agus_p')),
  ((select id from public.reports where judul like 'TPS dekat pasar%'),                 (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'TPS dekat pasar%'),                 (select id from public.profiles where username = 'agus_p')),
  ((select id from public.reports where judul like 'Got tersumbat limbah%'),            (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Got tersumbat limbah%'),            (select id from public.profiles where username = 'dewi_k')),
  ((select id from public.reports where judul like 'Got tersumbat limbah%'),            (select id from public.profiles where username = 'rafa_a')),
  ((select id from public.reports where judul like 'Pos kamtib gelap gulita%'),         (select id from public.profiles where username = 'budi_s')),
  ((select id from public.reports where judul like 'Pos kamtib gelap gulita%'),         (select id from public.profiles where username = 'sari_m')),
  ((select id from public.reports where judul like 'Pos kamtib gelap gulita%'),         (select id from public.profiles where username = 'dewi_k')),
  ((select id from public.reports where judul like 'Pos kamtib gelap gulita%'),         (select id from public.profiles where username = 'rafa_a'))
on conflict do nothing;

-- ------------------------------------------------------------
-- 6. Komentar natural antar warga
-- ------------------------------------------------------------
insert into public.comments (report_id, user_id, isi, created_at)
values
  ((select id from public.reports where judul like 'TPS liar%'),
   (select id from public.profiles where username = 'sari_m'),
   'Sudah mingguan numpuk ya, semoga cepat dianggot petugas.',
   now() - interval '13 days' + interval '3 hours'),
  ((select id from public.reports where judul like 'TPS liar%'),
   (select id from public.profiles where username = 'budi_s'),
   'Betul, saya tambahkan foto terbaru pagi ini biar makin jelas.',
   now() - interval '13 days' + interval '5 hours'),
  ((select id from public.reports where judul like 'Lampu jalan mati total%'),
   (select id from public.profiles where username = 'dewi_k'),
   'Tiap malam gelap total, seram buat motor lewat situ.',
   now() - interval '11 days' + interval '4 hours'),
  ((select id from public.reports where judul like 'Lampu jalan mati total%'),
   (select id from public.profiles where username = 'agus_p'),
   'Benar, kemarin ada tetangga hampir jatuh ke saluran depan situ.',
   now() - interval '10 days' + interval '9 hours'),
  ((select id from public.reports where judul like 'Gunungan sampah%'),
   (select id from public.profiles where username = 'agus_p'),
   'Baru lewat tadi pagi, bau sampai ke pinggir jalan raya.',
   now() - interval '7 days' + interval '6 hours'),
  ((select id from public.reports where judul like 'Gunungan sampah%'),
   (select id from public.profiles where username = 'dewan_kota'),
   'Terima kasih laporannya, kami eskalasi ke unit DLH kecamatan hari ini.',
   now() - interval '6 days' + interval '2 hours'),
  ((select id from public.reports where judul like 'Aspal berlubang%'),
   (select id from public.profiles where username = 'budi_s'),
   'Lubangnya makin melebar setelah hujan semalam, hati-hati pengendara.',
   now() - interval '4 days' + interval '8 hours'),
  ((select id from public.reports where judul like 'Got tersumbat limbah%'),
   (select id from public.profiles where username = 'rafa_a'),
   'Warung di hulu memang buang minyak langsung ke got, sudah sering ditegur.',
   now() - interval '3 days' + interval '7 hours'),
  ((select id from public.reports where judul like 'Pos kamtib gelap gulita%'),
   (select id from public.profiles where username = 'rafa_a'),
   'Alhamdulillah lampunya sudah menyala semua sejak kemarin malam.',
   now() - interval '6 days' + interval '10 hours'),
  ((select id from public.reports where judul like 'Lubang besar di tikungan dekat posyandu%'),
   (select id from public.profiles where username = 'rafa_a'),
   'Akhirnya ditambal juga, terima kasih pak RT yang mendampingi.',
   now() - interval '5 days' + interval '6 hours'),
  ((select id from public.reports where judul like 'Titik sampah di lapangan futsal%'),
   (select id from public.profiles where username = 'dewan_kota'),
   'Ditutup karena duplikat, silakan lanjutkan dukungan di laporan utama.',
   now() - interval '12 hours');

-- ------------------------------------------------------------
-- 7. Sinkronisasi poin akhir (menetralkan poin trigger seed
--    agar angka leaderboard persis sesuai skenario demo)
-- ------------------------------------------------------------
update public.profiles set poin = case username
  when 'budi_s' then 34
  when 'sari_m' then 27
  when 'agus_p' then 15
  when 'dewi_k' then 11
  when 'rafa_a' then 5
  else poin
end
where username in ('budi_s', 'sari_m', 'agus_p', 'dewi_k', 'rafa_a');

-- Segarkan badge berdasarkan aktivitas final
select public.check_badges(id) from public.profiles;
