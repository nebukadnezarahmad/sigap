-- ============================================================
-- SIGAP seed v4 — polling, aksi bersama, fasilitas hijau
-- Idempotent. Jalankan setelah seed.sql.
-- ============================================================

insert into public.polls (pertanyaan, opsi, aktif, created_by)
select
  'Apa fasilitas yang paling dibutuhkan RT ini tahun depan?',
  '["Bank sampah kelurahan","Taman hijau dan playgroup","Perbaikan drainase lingkungan","Shelter halte warga"]'::jsonb,
  true,
  (select id from public.profiles where username = 'dewan_kota')
where not exists (select 1 from public.polls);

insert into public.polls (pertanyaan, opsi, aktif, created_by)
select
  'Program mana yang ingin didahulukan pemerintah kota?',
  '["Gerakan zero waste pasar","Penghijauan jalur pedestrian","Sekolah lingkungan gratis"]'::jsonb,
  true,
  (select id from public.profiles where username = 'dewan_kota')
where (select count(*) from public.polls) < 2;

insert into public.polls (pertanyaan, opsi, aktif, created_by)
select
  'Seberapa siap kamu memilah sampah rumah tangga mulai minggu ini?',
  '["Sudah sejak lama","Siap mulai minggu ini","Masih butuh edukasi","Butuh fasilitas dulu"]'::jsonb,
  true,
  (select id from public.profiles where username = 'dewan_kota')
where (select count(*) from public.polls) < 3;

-- suara demo tersebar
insert into public.poll_votes (poll_id, user_id, opsi_idx)
select p.id, pr.id, (abs(hashtext(p.id::text || pr.username)) % 4)::smallint
from public.polls p
cross join public.profiles pr
where pr.username in ('budi_s','sari_m','agus_p','dewi_k','rafa_a')
  and (abs(hashtext(p.id::text || pr.username)) % 3) <> 0
on conflict do nothing;

insert into public.poll_votes (poll_id, user_id, opsi_idx)
select p.id, pr.id, 0
from public.polls p, public.profiles pr
where pr.username = 'dewan_kota'
on conflict do nothing;

-- ---------- aksi bersama ----------
insert into public.events (user_id, judul, deskripsi, alamat, tanggal)
select
  (select id from public.profiles where username = 'sari_m'),
  'Sabtu Bersih: Bengkel Sungai Sektor 4',
  'Gotong royong membersihkan bantaran kali sekaligus pemilahan sampah on-site. Bring: sarung tangan, topi, dan botol minum isi ulang. Kantong dan alat dari panitia.',
  'Bantaran Kali Ciliwung, RT 04 / RW 09',
  date_trunc('minute', now()) + interval '6 days 15 hours'
where not exists (select 1 from public.events where judul like 'Sabtu Bersih%');

insert into public.events (user_id, judul, deskripsi, alamat, tanggal)
select
  (select id from public.profiles where username = 'agus_p'),
  'Lokakarya Komposting Rumahan',
  'Praktik membuat komposter takashi dari ember bekas. Kuota 30 keluarga, hasil kompos dibawa pulang. Gratis untuk warga terdaftar SIGAP.',
  'Balai RW 07, Jl. Melati No. 12',
  date_trunc('minute', now()) + interval '12 days 9 hours'
where not exists (select 1 from public.events where judul like 'Lokakarya%');

insert into public.event_rsvp (event_id, user_id)
select e.id, pr.id
from public.events e
cross join public.profiles pr
where pr.username in ('budi_s','dewi_k','rafa_a','agus_p','sari_m')
  and (abs(hashtext(e.judul || pr.username)) % 2) = 0
on conflict do nothing;

-- ---------- fasilitas hijau ----------
insert into public.facilities (user_id, nama, jenis, alamat, jam_buka, lokasi)
select
  (select id from public.profiles where username = 'dewan_kota'),
  v.nama, v.jenis, v.alamat, v.jam,
  st_setsrid(st_makepoint(v.lng, v.lat), 4326)::geography
from (values
  ('Bank Sampah Melati Jaya', 'bank-sampah', 'Jl. Melati Raya No. 21', 'Senin–Sabtu 08.00–16.00', 106.8456, -6.2210),
  ('TPS3R Harapan Baru', 'tps3r', 'Jl. Anggrek No. 3', 'Setiap hari 06.00–10.00', 106.8300, -6.1683),
  ('Dropbox Daur Alun-Alun', 'dropbox', 'Alun-alun timur, depan masjid', '24 jam', 106.8003, -6.2351),
  ('Bank Sampah Kader PKK 07', 'bank-sampah', 'Balai RW 07', 'Jumat 09.00–12.00', 106.8671, -6.1900),
  ('Dropbox Eco-Point Pasar Induk', 'dropbox', 'Gerbang timur pasar induk', '05.00–17.00', 106.8120, -6.2450),
  ('TPS3R Unit Kampung Hijau', 'tps3r', 'Gang Mawar II', 'Selasa & Jumat 07.00–11.00', 106.8550, -6.2600)
) as v(nama, jenis, alamat, jam, lng, lat)
where not exists (select 1 from public.facilities f where f.nama = v.nama);
