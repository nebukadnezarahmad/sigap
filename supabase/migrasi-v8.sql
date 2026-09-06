-- Migrasi V8 SIGAP: foto bukti wajib di level database.
-- Pasangan penegakan UI di admin-panel.tsx (tolak submit tanpa foto) dan
-- pembatasan dropdown STATUS_LANJUTAN (Selesai tak bisa dipilih manual).
-- Jalankan di Supabase SQL Editor (idempoten).

create or replace function public.wajib_bukti_selesai()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status in ('selesai', 'menunggu_verifikasi')
     and old.status is distinct from new.status then
    if not exists (
      select 1 from public.report_photos
      where report_id = new.id and fase = 'sesudah'
    ) then
      raise exception 'Laporan tidak bisa diubah ke status ini tanpa foto bukti fisik.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_wajib_bukti_selesai on public.reports;
create trigger trg_wajib_bukti_selesai
  before update on public.reports
  for each row execute function public.wajib_bukti_selesai();
