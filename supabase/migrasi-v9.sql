-- ============================================================
-- SIGAP migrasi V9 — perbaiki guard v7 yang memblokir alur warga normal.
-- Idempotent: CREATE OR REPLACE semua; aman dijalankan ulang.
-- Urutan di SQL Editor: migrasi-v6.sql DULU (enum + laporan_mirip),
-- lalu file ini. migrasi-v8.sql boleh kapan saja (independen).
-- ============================================================

-- Latar: guard_poin() menolak SETIAP perubahan poin oleh non-admin,
-- termasuk update sistem dari trigger award (+10 lapor, +3 komen, +1 vote,
-- quiz/kalkulator/rsvp/fasilitas/pasar). Akibatnya warga gagal melapor,
-- berkomentar, dan vote sejak v7. Pola perbaikan: flag transaksi lokal
-- 'app.bypass_poin_guard' yang HANYA diset oleh fungsi award sistem.
-- Update langsung dari client tidak punya flag → tetap ditolak.

-- 1. guard_poin: izinkan update sistem ber-flag, tolak sisanya.
create or replace function public.guard_poin()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.poin is distinct from new.poin then
    if current_setting('app.bypass_poin_guard', true) = 'on' then
      return new; -- update poin dari fungsi award sistem (tepercaya)
    end if;
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

-- 2. guard_report_owner_edit: izinkan flip status sistem dari konfirmasi_laporan.
-- Tanpa ini, konfirmasi ke-2 oleh warga non-pemilik selalu RAISE.
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
  if current_setting('app.bypass_owner_guard', true) = 'on' then
    return new; -- flip status sistem via konfirmasi_laporan (tepercaya)
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

-- ------------------------------------------------------------
-- 3. Fungsi award: set flag sebelum update poin.
-- Isi identik dengan definisi terakhir (schema/v5/v7), hanya +1 baris.
-- ------------------------------------------------------------

create or replace function public.award_points_on_report()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform set_config('app.bypass_poin_guard', 'on', true);
  update public.profiles set poin = poin + 10 where id = new.user_id;
  perform public.check_badges(new.user_id);
  return new;
end;
$$;

create or replace function public.award_points_on_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform set_config('app.bypass_poin_guard', 'on', true);
  update public.profiles set poin = poin + 3 where id = new.user_id;
  perform public.check_badges(new.user_id);
  return new;
end;
$$;

create or replace function public.award_points_on_vote()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform set_config('app.bypass_poin_guard', 'on', true);
  update public.profiles set poin = poin + 1 where id = new.user_id;
  perform public.check_badges(new.user_id);
  return new;
end;
$$;

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
    perform set_config('app.bypass_poin_guard', 'on', true);
    update public.profiles set poin = poin + 15 where id = new.user_id;
    insert into public.notifications (user_id, jenis, judul, isi)
    values (new.user_id, 'poin', 'Quiz lingkungan lulus', 'Skor ' || new.benar || '/' || new.total || ' — +15 poin');
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

create or replace function public.award_kalkulator()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    perform set_config('app.bypass_poin_guard', 'on', true);
    update public.profiles set poin = poin + 5 where id = new.user_id;
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

create or replace function public.award_rsvp()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    perform set_config('app.bypass_poin_guard', 'on', true);
    update public.profiles set poin = poin + 5 where id = new.user_id;
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

create or replace function public.award_fasilitas()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    perform set_config('app.bypass_poin_guard', 'on', true);
    update public.profiles set poin = poin + 8 where id = new.user_id;
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

create or replace function public.award_pasar_pasang()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    perform set_config('app.bypass_poin_guard', 'on', true);
    update public.profiles set poin = poin + 10 where id = new.user_id;
    insert into public.notifications (user_id, jenis, judul, isi)
    values (new.user_id, 'poin', 'Barang tayang di Pasar ReUse',
            '"' || new.judul || '" — +10 poin');
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

create or replace function public.award_pasar_klaim()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.status = 'tersedia' and new.status = 'terklaim'
     and new.claimed_by is not null
     and new.claimed_by <> new.user_id
     and auth.uid() is not null then
    perform set_config('app.bypass_poin_guard', 'on', true);
    update public.profiles set poin = poin + 3 where id = new.claimed_by;
    insert into public.notifications (user_id, jenis, judul, isi)
    values (new.claimed_by, 'poin', 'Klaim barang tercatat',
            '"' || new.judul || '" — +3 poin. Ambil di titik yang disepakati ya.');
    perform public.check_badges(new.claimed_by);
  end if;
  return new;
end;
$$;

-- Helper delta (dipakai deduct vote/komentar/rsvp + klaim_barang).
create or replace function public.award_points_delta(p_user uuid, p_delta int)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_user is null then
    return;
  end if;
  perform set_config('app.bypass_poin_guard', 'on', true);
  update public.profiles
  set poin = greatest(0, poin + p_delta)
  where id = p_user;
end;
$$;

-- ------------------------------------------------------------
-- 4. konfirmasi_laporan: set flag owner-guard sebelum flip status.
-- Isi identik v7, hanya +1 baris perform set_config.
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
    perform set_config('app.bypass_owner_guard', 'on', true);
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
