-- ============================================================
-- SIGAP migrasi v4 — polling, fasilitas, aksi, edukasi/quiz,
-- kalkulator, ikuti area. Idempotent.
-- ============================================================

-- ---------- 1. Polling partisipatif ----------
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
