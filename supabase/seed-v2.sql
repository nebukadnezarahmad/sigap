-- ============================================================
-- SIGAP seed v2 tambahan — petugas, konfirmasi, notifikasi
-- Idempotent. Jalankan setelah seed.sql.
-- ============================================================

update public.reports set petugas = 'Tim DLH Kecamatan', assigned_at = now() - interval '2 days'
where status in ('dikerjakan', 'selesai') and petugas is null;

update public.reports set petugas = 'Dinas PU Bina Marga', assigned_at = now() - interval '1 day'
where status = 'diverifikasi' and petugas is null
  and exists (select 1 from public.categories c where c.id = reports.category_id and c.slug = 'jalan');

insert into public.confirmations (report_id, user_id)
select r.id, p.id
from public.reports r
join public.profiles p on p.username in ('sari_m', 'agus_p', 'dewi_k', 'rafa_a')
where r.user_id <> p.id
on conflict do nothing;

insert into public.notifications (user_id, jenis, judul, isi, report_id, dibaca, created_at)
select r.user_id,
       'status',
       'Laporanmu: ' || r.judul,
       'Status berubah menjadi "' || r.status::text || '"',
       r.id,
       false,
       now() - interval '3 hours'
from public.reports r
where r.status <> 'baru'
order by r.created_at desc
limit 4;

insert into public.notifications (user_id, jenis, judul, isi, report_id, dibaca, created_at)
select r.user_id,
       'konfirmasi',
       'Laporanmu dikonfirmasi warga',
       'Warga lain juga melihat masalah "' || r.judul || '"',
       r.id,
       false,
       now() - interval '1 hour'
from public.reports r
join public.confirmations cf on cf.report_id = r.id
where not exists (
  select 1 from public.notifications n
  where n.report_id = r.id and n.jenis = 'konfirmasi'
)
limit 3;
