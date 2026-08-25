-- ============================================================
-- SIGAP schema v1
-- Portal pelaporan masalah permukiman berbasis peta (Supabase).
-- Jalankan SEKALI di Supabase Dashboard > SQL Editor,
-- SEBELUM menjalankan supabase/seed.sql.
-- ============================================================

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. ENUM status laporan
-- ------------------------------------------------------------
create type public.report_status as enum
  ('baru', 'diverifikasi', 'dikerjakan', 'selesai', 'ditolak');

-- ------------------------------------------------------------
-- 2. Profiles
-- ------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null
               check (char_length(username) between 3 and 20
                      and username ~ '^[a-z0-9_]+$'),
  nama_lengkap text not null default 'Warga',
  avatar_url   text,
  role         text not null default 'warga'
               check (role in ('warga', 'admin')),
  poin         integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Categories + seed 6 kategori bawaan
-- ------------------------------------------------------------
create table public.categories (
  id    bigint generated always as identity primary key,
  slug  text unique not null,
  nama  text not null,
  warna text not null,
  emoji text not null default '📌'
);

insert into public.categories (slug, nama, warna, emoji) values
  ('sampah',      'Sampah Menumpuk',   '#65a30d', '🗑️'),
  ('drainase',    'Drainase & Banjir', '#0284c7', '🌊'),
  ('lampu',       'Lampu Jalan Mati',  '#f59e0b', '💡'),
  ('jalan',       'Jalan Rusak',       '#78716c', '🛣️'),
  ('ruang-hijau', 'Ruang Hijau',       '#059669', '🌳'),
  ('lainnya',     'Lainnya',           '#64748b', '📌')
on conflict do nothing;

-- ------------------------------------------------------------
-- 4. Reports
-- ------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category_id bigint references public.categories(id),
  judul       text not null check (char_length(judul) between 5 and 120),
  deskripsi   text not null check (char_length(deskripsi) <= 4000),
  alamat_teks text,
  foto_url    text,
  lokasi      geography(point, 4326) not null,
  lat         double precision generated always as ((st_y(lokasi::geometry))::double precision) stored,
  lng         double precision generated always as ((st_x(lokasi::geometry))::double precision) stored,
  status      public.report_status not null default 'baru',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index reports_lokasi_idx   on public.reports using gist (lokasi);
create index reports_created_idx  on public.reports (created_at desc);
create index reports_status_idx   on public.reports (status);
create index reports_category_idx on public.reports (category_id);
create index reports_user_idx     on public.reports (user_id);

-- updated_at otomatis (fungsi generik, bisa dipakai tabel lain)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_reports_set_updated_at
  before update on public.reports
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. Comments
-- ------------------------------------------------------------
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  isi        text not null check (char_length(isi) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_report_created_idx on public.comments (report_id, created_at);

-- ------------------------------------------------------------
-- 6. Votes
-- ------------------------------------------------------------
create table public.votes (
  report_id  uuid not null references public.reports(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

-- ------------------------------------------------------------
-- 7. User badges (gamifikasi)
-- ------------------------------------------------------------
create table public.user_badges (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  badge_key  text not null,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

-- ------------------------------------------------------------
-- 8. Report events (riwayat status)
-- ------------------------------------------------------------
create table public.report_events (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports(id) on delete cascade,
  status     public.report_status not null,
  catatan    text,
  actor_id   uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index report_events_report_idx on public.report_events (report_id, created_at);

-- ============================================================
-- FUNGSI & TRIGGER SERVER-SIDE
-- ============================================================

-- ------------------------------------------------------------
-- 9. Buat profiles otomatis saat signup (AFTER INSERT ON auth.users)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  u text;
begin
  -- kandidat: meta 'username' dari signup, fallback lokal email;
  -- buang semua karakter di luar [a-z0-9_]
  u := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));

  if u is null or char_length(u) < 3 then
    u := 'warga_' || substring(new.id::text, 1, 4);
  end if;

  u := left(u, 20);

  -- konflik pertama: tambahkan suffix dari 4 char awal UUID user
  if exists (select 1 from public.profiles where username = u) then
    u := left(u, 15) || '_' || substring(new.id::text, 1, 4);
  end if;

  -- konflik kedua (ekstrem): suffix angka acak
  if exists (select 1 from public.profiles where username = u) then
    u := left(u, 12) || floor(random() * 90000 + 10000)::bigint::text;
  end if;

  insert into public.profiles (id, username, nama_lengkap)
  values (
    new.id,
    u,
    coalesce(nullif(new.raw_user_meta_data->>'nama_lengkap', ''), 'Warga')
  );

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 10. Poin gamifikasi + 11. badge otomatis
-- ------------------------------------------------------------
create or replace function public.check_badges(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_reports  int;
  v_votes    int;
  v_comments int;
begin
  select count(*) into v_reports  from public.reports  where user_id = p_user_id;
  select count(*) into v_votes    from public.votes   where user_id = p_user_id;
  select count(*) into v_comments from public.comments where user_id = p_user_id;

  if v_reports >= 1 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'langkah_pertama') on conflict do nothing;
  end if;
  if v_reports >= 5 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'kontributor') on conflict do nothing;
  end if;
  if v_reports >= 10 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'juru_bersih') on conflict do nothing;
  end if;
  if v_votes >= 10 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'pendengar') on conflict do nothing;
  end if;
  if v_votes >= 25 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'suara_rakyat') on conflict do nothing;
  end if;
  if v_comments >= 10 then
    insert into public.user_badges (user_id, badge_key)
    values (p_user_id, 'pemberi_semangat') on conflict do nothing;
  end if;
end;
$$;

-- lapor = +10 poin
create or replace function public.award_points_on_report()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set poin = poin + 10 where id = new.user_id;
  perform public.check_badges(new.user_id);
  return new;
end;
$$;

create trigger trg_points_on_report
  after insert on public.reports
  for each row execute function public.award_points_on_report();

-- komentar = +3 poin
create or replace function public.award_points_on_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set poin = poin + 3 where id = new.user_id;
  perform public.check_badges(new.user_id);
  return new;
end;
$$;

create trigger trg_points_on_comment
  after insert on public.comments
  for each row execute function public.award_points_on_comment();

-- vote = +1 poin (PK mencegah duplikat, tidak perlu guard tambahan)
create or replace function public.award_points_on_vote()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set poin = poin + 1 where id = new.user_id;
  perform public.check_badges(new.user_id);
  return new;
end;
$$;

create trigger trg_points_on_vote
  after insert on public.votes
  for each row execute function public.award_points_on_vote();

-- ------------------------------------------------------------
-- 12. Riwayat perubahan status laporan
-- ------------------------------------------------------------
create or replace function public.log_report_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.report_events (report_id, status, catatan, actor_id)
  values (new.id, new.status, null, new.user_id);
  return new;
end;
$$;

create trigger trg_report_status_change
  after update of status on public.reports
  for each row
  when (old.status is distinct from new.status)
  execute function public.log_report_status_change();

-- ============================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles      ENABLE ROW LEVEL SECURITY;
alter table public.categories    ENABLE ROW LEVEL SECURITY;
alter table public.reports       ENABLE ROW LEVEL SECURITY;
alter table public.comments      ENABLE ROW LEVEL SECURITY;
alter table public.votes         ENABLE ROW LEVEL SECURITY;
alter table public.user_badges   ENABLE ROW LEVEL SECURITY;
alter table public.report_events ENABLE ROW LEVEL SECURITY;

-- helper admin (SECURITY DEFINER agar bisa membaca profiles tanpa RLS rekursif)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- profiles ----------
create policy "profiles_select_public" on public.profiles
  for select using (true);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Guard anti-promosi-diri: role hanya boleh berubah oleh admin lewat app,
-- atau oleh operasi tepercaya tanpa konteks JWT (SQL Editor / service role).
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is null then
      return new; -- dijalankan dari SQL Editor / service role (tepercaya)
    elsif auth.uid() <> old.id or not public.is_admin() then
      return null; -- tolak: bukan admin yang mengubah role
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_guard_role_change
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- ---------- categories ----------
create policy "categories_select_public" on public.categories
  for select using (true);
-- tanpa policy tulis: kategori hanya dikelola service role

-- ---------- reports ----------
create policy "reports_select_public" on public.reports
  for select using (true);

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = user_id);

create policy "reports_delete_own_new" on public.reports
  for delete using (auth.uid() = user_id and status = 'baru');

create policy "reports_update_admin_or_owner_new" on public.reports
  for update using (
    public.is_admin()
    or (auth.uid() = user_id)
  ) with check (
    public.is_admin()
    or (auth.uid() = user_id)
  );

-- Guard integritas: pemilik hanya boleh menyunting konten selama status masih
-- 'baru', tanpa bisa mengubah status maupun kepemilikan. Admin bebas.
create or replace function public.guard_report_owner_edit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if auth.uid() is null then
    return new; -- SQL Editor / service role (tepercaya, dipakai seeding)
  end if;
  if auth.uid() <> new.user_id then
    return null;
  end if;
  if old.status <> 'baru'
     or new.status is distinct from old.status
     or new.user_id is distinct from old.user_id then
    return null;
  end if;
  return new;
end;
$$;

create trigger trg_guard_report_owner_edit
  before update on public.reports
  for each row execute function public.guard_report_owner_edit();

-- ---------- comments ----------
create policy "comments_select_public" on public.comments
  for select using (true);

create policy "comments_insert_own" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = user_id);

-- ---------- votes ----------
create policy "votes_select_public" on public.votes
  for select using (true);

create policy "votes_insert_own" on public.votes
  for insert with check (auth.uid() = user_id);

create policy "votes_delete_own" on public.votes
  for delete using (auth.uid() = user_id);

-- ---------- user_badges ----------
create policy "user_badges_select_public" on public.user_badges
  for select using (true);
-- tulis hanya lewat trigger server-side (SECURITY DEFINER)

-- ---------- report_events ----------
create policy "report_events_select_public" on public.report_events
  for select using (true);
-- tulis hanya lewat trigger server-side (SECURITY DEFINER)

-- ============================================================
-- 14. STORAGE: bucket foto laporan (publik untuk dibaca)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('foto-laporan', 'foto-laporan', true)
on conflict (id) do nothing;

create policy "foto_laporan_select_public" on storage.objects
  for select using (bucket_id = 'foto-laporan');

create policy "foto_laporan_insert_authenticated" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'foto-laporan'
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower((storage.extension(name))) in ('png','jpg','jpeg','webp','gif')
  );

create policy "foto_laporan_update_owner" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'foto-laporan'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'foto-laporan'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "foto_laporan_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'foto-laporan'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 15. REALTIME: daftarkan tabel ke publikasi supabase_realtime
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.reports;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.votes;
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- 16. V2 — foto, konfirmasi, notifikasi, penugasan
-- (disalin dari migrasi-v2.sql; lihat berkas itu)
-- ============================================================

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

-- ============================================================
-- 17. V3 — notif komentar, cooldown lapor, edit catatan event
-- (lihat migrasi-v3.sql)
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

-- ============================================================
-- 18. V4 — polling, fasilitas, aksi, quiz, kalkulator, ikuti area
-- (lihat migrasi-v4.sql)
-- ============================================================

create table if not exists public.polls (
  id         uuid primary key default gen_random_uuid(),
  pertanyaan text not null check (char_length(pertanyaan) between 10 and 300),
  opsi       jsonb not null check (jsonb_typeof(opsi) = 'array' and jsonb_array_length(opsi) between 2 and 6),
  aktif      boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  poll_id   uuid not null references public.polls(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  opsi_idx  smallint not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

alter table public.polls ENABLE ROW LEVEL SECURITY;
alter table public.poll_votes ENABLE ROW LEVEL SECURITY;

create policy "polls_select_public" on public.polls for select using (true);
create policy "polls_insert_admin" on public.polls for insert
  with check (public.is_admin());
create policy "polls_update_admin" on public.polls for update
  using (public.is_admin()) with check (public.is_admin());

create policy "poll_votes_select_public" on public.poll_votes for select using (true);
create policy "poll_votes_insert_own" on public.poll_votes for insert
  with check (
    auth.uid() = user_id
    and opsi_idx >= 0
    and opsi_idx < (select jsonb_array_length(opsi) from public.polls where id = poll_id)
  );

-- ---------- 2. Fasilitas hijau ----------
create table if not exists public.facilities (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  nama       text not null check (char_length(nama) between 3 and 100),
  jenis      text not null check (jenis in ('bank-sampah','tps3r','dropbox')),
  alamat     text,
  jam_buka   text,
  lokasi     geography(point, 4326) not null,
  lat        double precision generated always as ((st_y(lokasi::geometry))::double precision) stored,
  lng        double precision generated always as ((st_x(lokasi::geometry))::double precision) stored,
  created_at timestamptz not null default now()
);

create index if not exists facilities_lokasi_idx on public.facilities using gist (lokasi);

alter table public.facilities ENABLE ROW LEVEL SECURITY;

create policy "facilities_select_public" on public.facilities for select using (true);
create policy "facilities_insert_auth" on public.facilities for insert
  with check (auth.uid() = user_id);
create policy "facilities_delete_owner" on public.facilities for delete
  using (auth.uid() = user_id or public.is_admin());

-- ---------- 3. Aksi bersama ----------
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  judul      text not null check (char_length(judul) between 5 and 120),
  deskripsi  text not null check (char_length(deskripsi) <= 2000),
  alamat     text,
  tanggal    timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_rsvp (
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.events ENABLE ROW LEVEL SECURITY;
alter table public.event_rsvp ENABLE ROW LEVEL SECURITY;

create policy "events_select_public" on public.events for select using (true);
create policy "events_insert_auth" on public.events for insert
  with check (auth.uid() = user_id);
create policy "events_delete_owner" on public.events for delete
  using (auth.uid() = user_id or public.is_admin());

create policy "rsvp_select_public" on public.event_rsvp for select using (true);
create policy "rsvp_insert_own" on public.event_rsvp for insert
  with check (auth.uid() = user_id);
create policy "rsvp_delete_own" on public.event_rsvp for delete
  using (auth.uid() = user_id);

-- ---------- 4. Quiz edukasi ----------
create table if not exists public.quiz_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  benar      smallint not null,
  total      smallint not null,
  created_at timestamptz not null default now()
);

alter table public.quiz_results ENABLE ROW LEVEL SECURITY;

create policy "quiz_select_own" on public.quiz_results
  for select using (auth.uid() = user_id or public.is_admin());
create policy "quiz_insert_own" on public.quiz_results
  for insert with check (auth.uid() = user_id and total > 0 and benar >= 0 and benar <= total);

-- ---------- 5. Kalkulator jejak sampah ----------
create table if not exists public.kalkulator_hasil (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  kg_tahun   numeric(8,1) not null check (kg_tahun >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kalkulator_hasil ENABLE ROW LEVEL SECURITY;

create policy "kalkulator_select_own" on public.kalkulator_hasil
  for select using (auth.uid() = user_id);
create policy "kalkulator_write_own" on public.kalkulator_hasil
  for insert with check (auth.uid() = user_id);
create policy "kalkulator_update_own" on public.kalkulator_hasil
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- 6. Ikuti area ----------
create table if not exists public.area_follows (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  label      text not null default 'Area saya',
  lokasi     geography(point, 4326) not null,
  radius_m   integer not null default 1000 check (radius_m between 200 and 5000),
  created_at timestamptz not null default now()
);

alter table public.area_follows ENABLE ROW LEVEL SECURITY;

create policy "area_select_own" on public.area_follows
  for select using (auth.uid() = user_id);
create policy "area_insert_own" on public.area_follows
  for insert with check (auth.uid() = user_id);
create policy "area_delete_own" on public.area_follows
  for delete using (auth.uid() = user_id);

-- ---------- 7. Jenis notifikasi 'area' ----------
alter table public.notifications drop constraint if exists notifications_jenis_check;
alter table public.notifications
  add constraint notifications_jenis_check
  check (jenis in ('status','konfirmasi','poin','tugas','area'));

-- ---------- 8. Poin & badge baru ----------
create or replace function public.check_badges(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_reports  int; v_votes int; v_comments int;
  v_quiz int; v_rsvp int; v_fasilitas int;
begin
  select count(*) into v_reports  from public.reports  where user_id = p_user_id;
  select count(*) into v_votes    from public.votes   where user_id = p_user_id;
  select count(*) into v_comments from public.comments where user_id = p_user_id;
  select count(*) into v_quiz     from public.quiz_results where user_id = p_user_id and benar >= 4;
  select count(*) into v_rsvp     from public.event_rsvp where user_id = p_user_id;
  select count(*) into v_fasilitas from public.facilities where user_id = p_user_id;

  if v_reports >= 1 then
    insert into public.user_badges values (p_user_id, 'langkah_pertama', now()) on conflict do nothing;
  end if;
  if v_reports >= 5 then
    insert into public.user_badges values (p_user_id, 'kontributor', now()) on conflict do nothing;
  end if;
  if v_reports >= 10 then
    insert into public.user_badges values (p_user_id, 'juru_bersih', now()) on conflict do nothing;
  end if;
  if v_votes >= 10 then
    insert into public.user_badges values (p_user_id, 'pendengar', now()) on conflict do nothing;
  end if;
  if v_votes >= 25 then
    insert into public.user_badges values (p_user_id, 'suara_rakyat', now()) on conflict do nothing;
  end if;
  if v_comments >= 10 then
    insert into public.user_badges values (p_user_id, 'pemberi_semangat', now()) on conflict do nothing;
  end if;
  if v_quiz >= 1 then
    insert into public.user_badges values (p_user_id, 'cerdas_lingkungan', now()) on conflict do nothing;
  end if;
  if v_rsvp >= 2 then
    insert into public.user_badges values (p_user_id, 'relawan', now()) on conflict do nothing;
  end if;
  if v_fasilitas >= 2 then
    insert into public.user_badges values (p_user_id, 'penyedia_solusi', now()) on conflict do nothing;
  end if;
end;
$$;

-- quiz lulus pertama kali: +15
create or replace function public.award_quiz()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.benar >= 4 and auth.uid() is not null and not exists (
    select 1 from public.quiz_results
    where user_id = new.user_id and benar >= 4 and id <> new.id
  ) then
    update public.profiles set poin = poin + 15 where id = new.user_id;
    insert into public.notifications (user_id, jenis, judul, isi)
    values (new.user_id, 'poin', 'Quiz lingkungan lulus', 'Skor ' || new.benar || '/' || new.total || ' — +15 poin');
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_quiz on public.quiz_results;
create trigger trg_award_quiz
  after insert on public.quiz_results
  for each row execute function public.award_quiz();

-- kalkulator pertama kali: +5
create or replace function public.award_kalkulator()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    update public.profiles set poin = poin + 5 where id = new.user_id;
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_kalkulator on public.kalkulator_hasil;
create trigger trg_award_kalkulator
  after insert on public.kalkulator_hasil
  for each row execute function public.award_kalkulator();

-- ikut aksi: +5
create or replace function public.award_rsvp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    update public.profiles set poin = poin + 5 where id = new.user_id;
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_rsvp on public.event_rsvp;
create trigger trg_award_rsvp
  after insert on public.event_rsvp
  for each row execute function public.award_rsvp();

-- tambah fasilitas: +8
create or replace function public.award_fasilitas()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    update public.profiles set poin = poin + 8 where id = new.user_id;
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_fasilitas on public.facilities;
create trigger trg_award_fasilitas
  after insert on public.facilities
  for each row execute function public.award_fasilitas();

-- ---------- 9. Ikuti area: laporan baru dalam radius -> notifikasi ----------
create or replace function public.notify_area_followers()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  pengikut record;
begin
  for pengikut in
    select af.user_id, af.id as follow_id
    from public.area_follows af
    where st_dwithin(af.lokasi, new.lokasi, af.radius_m)
      and af.user_id <> new.user_id
  loop
    insert into public.notifications (user_id, jenis, judul, isi, report_id)
    values (
      pengikut.user_id,
      'area',
      'Laporan baru di area yang kamu ikuti',
      new.judul,
      new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_area on public.reports;
create trigger trg_notify_area
  after insert on public.reports
  for each row execute function public.notify_area_followers();

-- ---------- 10. Realtime ----------
do $$ begin
  alter publication supabase_realtime add table public.poll_votes;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.event_rsvp;
exception when duplicate_object then null; end $$;
