-- migrasi-v13: selaraskan riwayat report_events dengan tanggal laporan.
--
-- Latar: migrasi-v12 menggeser reports.created_at relatif ke now() agar masuk
-- jendela 14 hari, tetapi created_at pada report_events TIDAK ikut digeser —
-- barisnya masih memakai tanggal seed lama (Agustus 2026). Akibatnya durasi
-- penyelesaian jadi negatif dan halaman transparansi menampilkan
-- "Median waktu beres -25 hari", angka yang mustahil untuk sebuah durasi.
--
-- Masalah kedua: riwayat menumpuk baris kembar karena seed menulis
-- report_events secara manual sementara trigger trg_report_status_change juga
-- menulis baris baru pada setiap perubahan status. Satu laporan bisa punya
-- 14 baris riwayat dengan 2 baris 'selesai'.
--
-- Perbaikan:
--   1. buang baris kembar persis (report_id, status, catatan) — sisakan terlama
--   2. sebar ulang created_at tiap event secara proporsional di antara
--      reports.created_at dan reports.updated_at, urutan status dipertahankan
--
-- Idempoten: aman dijalankan berulang. Langkah 1 tidak menyisakan apa pun pada
-- jalan kedua; langkah 2 menghasilkan nilai yang sama karena dihitung dari
-- reports.created_at/updated_at, bukan dari created_at event itu sendiri.

-- ---------------------------------------------------------------- 1. dedupe
with ganda as (
  select id,
         row_number() over (
           partition by report_id, status, coalesce(catatan, '')
           order by created_at, id
         ) as rn
  from public.report_events
)
delete from public.report_events e
using ganda g
where e.id = g.id
  and g.rn > 1;

-- ------------------------------------------------- 2. sebar ulang created_at
-- Akhir rentang memakai greatest(updated_at, created_at + 1 jam) supaya selalu
-- ada rentang: laporan yang belum pernah diperbarui pun tidak menghasilkan
-- durasi nol atau negatif.
with urut as (
  select e.id,
         row_number() over (
           partition by e.report_id order by e.created_at, e.id
         ) as rn,
         count(*) over (partition by e.report_id) as total,
         r.created_at as mulai,
         greatest(r.updated_at, r.created_at + interval '1 hour') as akhir
  from public.report_events e
  join public.reports r on r.id = e.report_id
)
update public.report_events e
set created_at = u.mulai + (u.akhir - u.mulai) * (u.rn::numeric / u.total::numeric)
from urut u
where e.id = u.id;

-- --------------------------------------------------------------- verifikasi
-- Setelah migrasi ini, query berikut harus mengembalikan 0 baris:
--
--   select count(*) from public.report_events e
--   join public.reports r on r.id = e.report_id
--   where e.created_at < r.created_at;
--
-- Dan "Median waktu beres" di halaman transparansi harus bernilai >= 0.
