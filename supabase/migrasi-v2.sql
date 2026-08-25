-- ============================================================
-- SIGAP migrasi v2 — fitur ekspansi
-- Aman dijalankan ulang (idempotent).
-- ============================================================

alter table public.reports
  add column if not exists petugas text,
  add column if not exists assigned_at timestamptz;

create table if not exists public.report_photos (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports(id) on delete cascade,
  url        text not null,
  fase       text not null default 'sebelum' check (fase in ('sebelum','sesudah')),
  created_at timestamptz not null default now()
);
create index if not exists report_photos_report_idx on public.report_photos (report_id);

create table if not exists public.confirmations (
  report_id  uuid not null references public.reports(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  jenis      text not null check (jenis in ('status','konfirmasi','poin','tugas')),
  judul      text not null,
  isi        text,
  report_id  uuid references public.reports(id) on delete cascade,
  dibaca     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- RLS ----------
alter table public.report_photos ENABLE ROW LEVEL SECURITY;
alter table public.confirmations  ENABLE ROW LEVEL SECURITY;
alter table public.notifications  ENABLE ROW LEVEL SECURITY;

create policy "photos_select_public" on public.report_photos
  for select using (true);

create policy "photos_insert_owner_or_admin" on public.report_photos
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

create policy "photos_delete_owner_or_admin" on public.report_photos
  for delete using (
    public.is_admin()
    or exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

create policy "confirm_select_public" on public.confirmations
  for select using (true);

create policy "confirm_insert_own" on public.confirmations
  for insert with check (
    auth.uid() = user_id
    and user_id <> (select user_id from public.reports where id = report_id)
  );

create policy "confirm_delete_own" on public.confirmations
  for delete using (auth.uid() = user_id);

create policy "notif_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notif_update_own" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- insert hanya lewat trigger SECURITY DEFINER

-- ---------- Trigger notifikasi ----------
create or replace function public.notify_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is distinct from new.user_id then
    insert into public.notifications (user_id, jenis, judul, isi, report_id)
    values (
      new.user_id,
      'status',
      'Laporanmu: ' || new.judul,
      'Status berubah menjadi "' || new.status::text || '"',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_status on public.reports;
create trigger trg_notify_status
  after update of status on public.reports
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_status_change();

create or replace function public.notify_confirmation()
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
      'Laporanmu dikonfirmasi warga',
      'Warga lain juga melihat masalah "' || v_judul || '"',
      new.report_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_confirm on public.confirmations;
create trigger trg_notify_confirm
  after insert on public.confirmations
  for each row
  execute function public.notify_confirmation();

create or replace function public.notify_assignment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.petugas is distinct from old.petugas and new.petugas is not null then
    insert into public.notifications (user_id, jenis, judul, isi, report_id)
    values (
      new.user_id,
      'tugas',
      'Laporanmu ditangani petugas',
      'Ditugaskan ke: ' || new.petugas,
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_assign on public.reports;
create trigger trg_notify_assign
  after update of petugas on public.reports
  for each row
  when (old.petugas is distinct from new.petugas)
  execute function public.notify_assignment();

-- ---------- Realtime ----------
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.confirmations;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.report_photos;
exception
  when duplicate_object then null;
end $$;
