-- ============================================================
-- SIGAP migrasi v3 — notifikasi komentar, cooldown lapor,
-- hak edit catatan event untuk admin.
-- Idempotent.
-- ============================================================

-- 1. Notifikasi saat laporan dikomentari (pemilik dikecualikan)
create or replace function public.notify_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_pemilik uuid;
  v_judul text;
begin
  select user_id, judul into v_pemilik, v_judul
  from public.reports where id = new.report_id;
  if v_pemilik is distinct from new.user_id then
    insert into public.notifications (user_id, jenis, judul, isi, report_id)
    values (
      v_pemilik,
      'konfirmasi',
      'Komentar baru di laporanmu',
      'Ada warga berkomentar pada "' || v_judul || '"',
      new.report_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment
  after insert on public.comments
  for each row
  execute function public.notify_comment();

-- 2. Cooldown lapor: maksimal 1 laporan per 60 detik per warga
create or replace function public.batas_lapor()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- seeding / service role
  end if;
  if exists (
    select 1 from public.reports
    where user_id = new.user_id
      and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'Tunggu sebentar — kirim maksimal satu laporan per menit.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_batas_lapor on public.reports;
create trigger trg_batas_lapor
  before insert on public.reports
  for each row
  execute function public.batas_lapor();

-- 3. Admin boleh melengkapi catatan pada event terbaru
create policy "events_update_admin" on public.report_events
  for update using (public.is_admin())
  with check (public.is_admin());
