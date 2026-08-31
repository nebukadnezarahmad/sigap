-- ============================================================
-- SIGAP migrasi v6 — 3 Fitur Pembeda Utama & Anti-AI Slop
-- 1. Status 'menunggu_verifikasi'
-- 2. RPC PostGIS 'laporan_mirip' (Deduplikasi Geospasial 100m)
-- 3. Akuntabilitas konfirmasi warga silang
-- ============================================================

-- 1. Tambah status menunggu_verifikasi jika belum ada
do $$
begin
  alter type public.report_status add value if not exists 'menunggu_verifikasi' before 'selesai';
exception
  when duplicate_object then null;
end $$;

-- 2. Fungsi PostGIS untuk Deduplikasi Geospasial 100m
create or replace function public.laporan_mirip(
  p_lat double precision,
  p_lng double precision,
  p_category_id bigint default null,
  p_radius_m integer default 100
)
returns table (
  id uuid,
  judul text,
  deskripsi text,
  status public.report_status,
  jarak_m double precision,
  vote_count bigint,
  foto_url text,
  created_at timestamptz
)
language sql stable as $$
  select
    r.id,
    r.judul,
    r.deskripsi,
    r.status,
    st_distance(r.lokasi::geography, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as jarak_m,
    coalesce((select count(*) from public.votes v where v.report_id = r.id), 0) as vote_count,
    r.foto_url,
    r.created_at
  from public.reports r
  where (p_category_id is null or r.category_id = p_category_id)
    and r.status not in ('selesai', 'ditolak')
    and r.created_at > now() - interval '30 days'
    and st_dwithin(r.lokasi::geography, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
  order by jarak_m asc
  limit 5;
$$;
