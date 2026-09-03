-- ============================================================
-- SIGAP migrasi v7 — hardening audit
-- Idempotent: aman dijalankan ulang.
-- Setiap statement memakai IF NOT EXISTS / DROP IF EXISTS /
-- CREATE OR REPLACE / DO block penangkap duplicate_object.
-- Urutan: schema.sql -> migrasi v2..v6 -> file ini -> seed.
-- ============================================================

-- Pastikan kolom penugasan ada (schema fresh-install mungkin
-- hanya membawa assigned_at; guard di bawah merujuk keduanya).
alter table public.reports add column if not exists petugas text;
alter table public.reports add column if not exists assigned_at timestamptz;

-- ------------------------------------------------------------
-- 1. Fix guard_role_change: hanya admin boleh ubah role.
-- Silent RETURN NULL diganti RAISE EXCEPTION.
-- Bypass saat auth.uid() IS NULL (seed / service_role).
-- Trigger lama tetap menunjuk nama fungsi yang sama,
-- jadi JANGAN drop trigger di sini.
-- ------------------------------------------------------------
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is null then
      return new; -- seed / service_role / SQL Editor (tepercaya)
    end if;
    if not public.is_admin() then
      raise exception 'hanya admin yang boleh mengubah role';
    end if;
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. guard_poin(): cegah UPDATE kolom poin oleh non-admin.
-- Memperkuat RLS profiles_update_self yang tanpa whitelist kolom.
-- ------------------------------------------------------------
create or replace function public.guard_poin()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.poin is distinct from new.poin then
    if auth.uid() is null then
      return new; -- seed / service_role (tepercaya)
    end if;
    if not public.is_admin() then
      raise exception 'hanya admin yang boleh mengubah poin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_poin on public.profiles;
create trigger trg_guard_poin
  before update on public.profiles
  for each row execute function public.guard_poin();

-- ------------------------------------------------------------
-- 3. Perluas guard_report_owner_edit: selain status/user_id,
-- tolak juga perubahan petugas, assigned_at, category_id,
-- lokasi, foto_url oleh non-admin (RAISE, bukan silent).
-- Bypass service_role/seed (auth.uid() IS NULL -> RETURN NEW).
-- ------------------------------------------------------------
create or replace function public.guard_report_owner_edit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- SQL Editor / service role (tepercaya, dipakai seeding)
  end if;
  if public.is_admin() then
    return new;
  end if;
  if auth.uid() <> new.user_id then
    raise exception 'hanya pemilik atau admin yang boleh mengubah laporan';
  end if;
  if old.status <> 'baru' then
    raise exception 'laporan hanya bisa diubah saat status baru';
  end if;
  if new.status is distinct from old.status then
    raise exception 'hanya admin yang boleh mengubah status';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'hanya admin yang boleh mengubah pemilik laporan';
  end if;
  if new.petugas is distinct from old.petugas then
    raise exception 'hanya admin yang boleh mengubah petugas';
  end if;
  if new.assigned_at is distinct from old.assigned_at then
    raise exception 'hanya admin yang boleh mengubah assigned_at';
  end if;
  if new.category_id is distinct from old.category_id then
    raise exception 'hanya admin yang boleh mengubah kategori';
  end if;
  if new.lokasi is distinct from old.lokasi then
    raise exception 'hanya admin yang boleh mengubah lokasi';
  end if;
  if new.foto_url is distinct from old.foto_url then
    raise exception 'hanya admin yang boleh mengubah foto_url';
  end if;
  return new;
end;
$$;

-- trigger trg_guard_report_owner_edit sudah ada dari schema
-- dan tetap menunjuk nama fungsi yang sama (tanpa DROP/CREATE ulang).

-- ------------------------------------------------------------
-- 10 (didahulukan). Helper delta poin + decrement saat hapus.
-- Didefinisikan awal agar RPC klaim_barang bisa memakainya.
-- ------------------------------------------------------------
create or replace function public.award_points_delta(p_user uuid, p_delta int)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_user is null then
    return;
  end if;
  update public.profiles
  set poin = greatest(0, poin + p_delta)
  where id = p_user;
end;
$$;

create or replace function public.deduct_points_on_vote_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.award_points_delta(old.user_id, -1);
  return old;
end;
$$;

drop trigger if exists trg_deduct_vote on public.votes;
create trigger trg_deduct_vote
  after delete on public.votes
  for each row execute function public.deduct_points_on_vote_delete();

create or replace function public.deduct_points_on_comment_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.award_points_delta(old.user_id, -3);
  return old;
end;
$$;

drop trigger if exists trg_deduct_comment on public.comments;
create trigger trg_deduct_comment
  after delete on public.comments
  for each row execute function public.deduct_points_on_comment_delete();

create or replace function public.deduct_points_on_rsvp_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.award_points_delta(old.user_id, -5);
  return old;
end;
$$;

drop trigger if exists trg_deduct_rsvp on public.event_rsvp;
create trigger trg_deduct_rsvp
  after delete on public.event_rsvp
  for each row execute function public.deduct_points_on_rsvp_delete();

-- ------------------------------------------------------------
-- 4. RPC konfirmasi_laporan(p_report_id uuid)
-- Kunci advisory per report, hitung confirmations, jika >=2
-- dan status menunggu_verifikasi -> update selesai +
-- insert report_events + notifikasi. Return {jumlah, selesai}.
-- ------------------------------------------------------------
create or replace function public.konfirmasi_laporan(p_report_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_jumlah  int := 0;
  v_status  public.report_status;
  v_pemilik uuid;
  v_judul   text;
  v_selesai boolean := false;
begin
  if auth.uid() is null then
    raise exception 'harus login untuk konfirmasi laporan';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_report_id::text));

  insert into public.confirmations (report_id, user_id)
  values (p_report_id, auth.uid())
  on conflict do nothing;

  select count(*) into v_jumlah
  from public.confirmations
  where report_id = p_report_id;

  select user_id, judul, status into v_pemilik, v_judul, v_status
  from public.reports
  where id = p_report_id;

  if v_jumlah >= 2 and v_status = 'menunggu_verifikasi' then
    update public.reports
    set status = 'selesai'
    where id = p_report_id and status = 'menunggu_verifikasi';
    v_selesai := true;

    insert into public.report_events (report_id, status, catatan, actor_id)
    values (p_report_id, 'selesai', 'Terverifikasi via konfirmasi warga (>=2)', auth.uid());

    insert into public.notifications (user_id, jenis, judul, isi, report_id)
    values (
      v_pemilik,
      'status',
      'Laporanmu: ' || coalesce(v_judul, ''),
      'Status berubah menjadi "selesai" via konfirmasi warga',
      p_report_id
    );
  end if;

  return jsonb_build_object('jumlah', v_jumlah, 'selesai', v_selesai);
end;
$$;

grant execute on function public.konfirmasi_laporan(uuid) to authenticated;

-- ------------------------------------------------------------
-- 5. RPC klaim_barang(p_id uuid)
-- Klaim atomik: hanya baris status='tersedia' yang bisa diambil.
-- ------------------------------------------------------------
create or replace function public.klaim_barang(p_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_judul text;
begin
  if auth.uid() is null then
    raise exception 'harus login untuk klaim barang';
  end if;

  perform pg_advisory_xact_lock(hashtext('klaim:' || p_id::text));

  update public.pasar_barang
  set status = 'terklaim',
      claimed_by = auth.uid()
  where id = p_id and status = 'tersedia';

  if not found then
    raise exception 'barang sudah diklaim';
  end if;

  select judul into v_judul from public.pasar_barang where id = p_id;

  perform public.award_points_delta(auth.uid(), 3);
  perform public.check_badges(auth.uid());

  insert into public.notifications (user_id, jenis, judul, isi)
  values (
    auth.uid(),
    'poin',
    'Klaim barang tercatat',
    '"' || coalesce(v_judul, '') || '" — +3 poin. Ambil di titik yang disepakati ya.'
  );

  return jsonb_build_object('id', p_id, 'status', 'terklaim');
end;
$$;

grant execute on function public.klaim_barang(uuid) to authenticated;

-- ------------------------------------------------------------
-- 6a. Cegah vote di poll nonaktif (BEFORE INSERT ON poll_votes).
-- ------------------------------------------------------------
create or replace function public.guard_poll_aktif()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_aktif boolean;
begin
  select aktif into v_aktif from public.polls where id = new.poll_id;
  if not coalesce(v_aktif, false) then
    raise exception 'polling sudah nonaktif';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_poll_aktif on public.poll_votes;
create trigger trg_guard_poll_aktif
  before insert on public.poll_votes
  for each row execute function public.guard_poll_aktif();

-- ------------------------------------------------------------
-- 6b. Cegah klaim via UPDATE langsung: perketat policy pasar.
-- Kolom umum hanya pemilik/admin; klaim HANYA via RPC klaim_barang
-- (klien diarahkan ke RPC, bukan UPDATE langsung).
-- ------------------------------------------------------------
drop policy if exists pasar_update_own on public.pasar_barang;
create policy "pasar_update_own" on public.pasar_barang for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------
-- 7a. Policy report_events_insert_admin (linimasa dari panel admin).
-- ------------------------------------------------------------
drop policy if exists report_events_insert_admin on public.report_events;
create policy "report_events_insert_admin" on public.report_events
  for insert with check (public.is_admin());

-- ------------------------------------------------------------
-- 7b. report_photos: CHECK url https + fase valid (idempoten).
-- ------------------------------------------------------------
do $$
begin
  alter table public.report_photos
    add constraint report_photos_url_fase_check
    check (url like 'https://%' and fase in ('sebelum', 'sesudah'));
exception
  when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- 8. Index kolom user_id + GiST area_follows + unique label.
-- ------------------------------------------------------------
create index if not exists votes_user_idx on public.votes (user_id);
create index if not exists comments_user_idx on public.comments (user_id);
create index if not exists confirmations_user_idx on public.confirmations (user_id);
create index if not exists poll_votes_user_idx on public.poll_votes (user_id);
create index if not exists facilities_user_idx on public.facilities (user_id);
create index if not exists events_user_idx on public.events (user_id);
create index if not exists event_rsvp_user_idx on public.event_rsvp (user_id);
create index if not exists reports_user_created_idx on public.reports (user_id, created_at desc);
create index if not exists area_follows_lokasi_idx on public.area_follows using gist (lokasi);
create unique index if not exists area_follows_user_label_uniq on public.area_follows (user_id, label);

-- ------------------------------------------------------------
-- 9a. batas_lapor anti-race: advisory lock per user.
-- (Tulis ulang fungsi; trigger lama tetap menunjuk nama sama.)
-- ------------------------------------------------------------
create or replace function public.batas_lapor()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext(coalesce(auth.uid()::text, 'anon')));
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

-- ------------------------------------------------------------
-- 9b. award_quiz anti double: advisory lock per user.
-- ------------------------------------------------------------
create or replace function public.award_quiz()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('quiz:' || coalesce(new.user_id::text, 'anon')));
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

-- ------------------------------------------------------------
-- 11. Realtime: daftarkan events, polls, facilities.
-- ALTER PUBLICATION ... ADD TABLE tidak mendukung IF NOT EXISTS,
-- jadi cek pg_publication_tables dulu. Jangan hapus yang sudah ada.
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'polls'
  ) then
    alter publication supabase_realtime add table public.polls;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'facilities'
  ) then
    alter publication supabase_realtime add table public.facilities;
  end if;
end $$;

-- ------------------------------------------------------------
-- 12. log_report_status_change: actor_id = auth.uid(),
-- fallback new.user_id jika NULL.
-- ------------------------------------------------------------
create or replace function public.log_report_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.report_events (report_id, status, catatan, actor_id)
  values (new.id, new.status, null, coalesce(auth.uid(), new.user_id));
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 13. reports lokasi valid: bujur -180..180, lintang -90..90.
-- ------------------------------------------------------------
do $$
begin
  alter table public.reports
    add constraint reports_lokasi_valid_check
    check (
      st_x(lokasi::geometry) between -180 and 180
      and st_y(lokasi::geometry) between -90 and 90
    );
exception
  when duplicate_object then null;
end $$;
