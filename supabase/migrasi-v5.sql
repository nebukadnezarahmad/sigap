-- ============================================================
-- SIGAP migrasi v5 — pasar ReUse, direktori layanan penting,
-- UMKM warga. Idempotent.
-- ============================================================

-- ---------- 1. Pasar ReUse (barang bekas layak pakai) ----------
create table if not exists public.pasar_barang (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  judul       text not null check (char_length(judul) between 3 and 120),
  deskripsi   text check (char_length(deskripsi) <= 1000),
  kategori    text not null check (kategori in ('elektronik','pakaian','mebel','buku','lainnya')),
  kondisi     text not null check (kondisi in ('seperti-baru','baik','cukup')),
  foto_url    text,
  titik_ambil text not null check (char_length(titik_ambil) between 3 and 160),
  status      text not null default 'tersedia' check (status in ('tersedia','terklaim')),
  claimed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.pasar_barang ENABLE ROW LEVEL SECURITY;

create policy "pasar_select_public" on public.pasar_barang for select using (true);
create policy "pasar_insert_own" on public.pasar_barang for insert
  with check (auth.uid() = user_id);
create policy "pasar_update_own" on public.pasar_barang for update
  using (auth.uid() = user_id or auth.uid() = claimed_by or public.is_admin())
  with check (auth.uid() = user_id or auth.uid() = claimed_by or public.is_admin());
create policy "pasar_delete_own" on public.pasar_barang for delete
  using (auth.uid() = user_id or public.is_admin());

-- ---------- 2. Direktori layanan penting ----------
create table if not exists public.layanan_penting (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null check (char_length(nama) between 3 and 120),
  kategori    text not null check (kategori in ('darurat','kesehatan','keamanan','lingkungan','utilitas')),
  telepon     text not null,
  bisa_wa     boolean not null default false,
  alamat      text,
  jam_layanan text not null default '24 jam',
  urutan      smallint not null default 100
);

alter table public.layanan_penting ENABLE ROW LEVEL SECURITY;

create policy "layanan_select_public" on public.layanan_penting for select using (true);
create policy "layanan_write_admin" on public.layanan_penting for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- 3. UMKM warga ----------
create table if not exists public.umkm (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null check (char_length(nama) between 3 and 100),
  kategori   text not null check (kategori in ('kuliner','kerajinan','jasa','pertanian','lainnya')),
  produk     text not null check (char_length(produk) <= 300),
  whatsapp   text not null,
  alamat     text,
  jam_buka   text,
  verified   boolean not null default false,
  owner_id   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.umkm ENABLE ROW LEVEL SECURITY;

create policy "umkm_select_public" on public.umkm for select using (true);
create policy "umkm_insert_own" on public.umkm for insert
  with check (auth.uid() = owner_id);
create policy "umkm_update_own" on public.umkm for update
  using (auth.uid() = owner_id or public.is_admin())
  with check (auth.uid() = owner_id or public.is_admin());
create policy "umkm_delete_admin" on public.umkm for delete
  using (public.is_admin());

-- ---------- 4. Badge baru: pahlawan reuse ----------
create or replace function public.check_badges(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_reports int; v_votes int; v_comments int;
  v_quiz int; v_rsvp int; v_fasilitas int; v_pasar int;
begin
  select count(*) into v_reports   from public.reports       where user_id = p_user_id;
  select count(*) into v_votes     from public.votes         where user_id = p_user_id;
  select count(*) into v_comments  from public.comments      where user_id = p_user_id;
  select count(*) into v_quiz      from public.quiz_results  where user_id = p_user_id and benar >= 4;
  select count(*) into v_rsvp      from public.event_rsvp    where user_id = p_user_id;
  select count(*) into v_fasilitas from public.facilities    where user_id = p_user_id;
  select count(*) into v_pasar     from public.pasar_barang  where user_id = p_user_id;

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
  if v_pasar >= 2 then
    insert into public.user_badges values (p_user_id, 'pahlawan_reuse', now()) on conflict do nothing;
  end if;
end;
$$;

-- pasang barang: +10
create or replace function public.award_pasar_pasang()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    update public.profiles set poin = poin + 10 where id = new.user_id;
    insert into public.notifications (user_id, jenis, judul, isi)
    values (new.user_id, 'poin', 'Barang tayang di Pasar ReUse',
            '"' || new.judul || '" — +10 poin');
    perform public.check_badges(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_pasar_pasang on public.pasar_barang;
create trigger trg_award_pasar_pasang
  after insert on public.pasar_barang
  for each row execute function public.award_pasar_pasang();

-- barang diklaim: pengklaim +3, pemilik tidak berubah
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
    update public.profiles set poin = poin + 3 where id = new.claimed_by;
    insert into public.notifications (user_id, jenis, judul, isi)
    values (new.claimed_by, 'poin', 'Klaim barang tercatat',
            '"' || new.judul || '" — +3 poin. Ambil di titik yang disepakati ya.');
    perform public.check_badges(new.claimed_by);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_pasar_klaim on public.pasar_barang;
create trigger trg_award_pasar_klaim
  after update on public.pasar_barang
  for each row execute function public.award_pasar_klaim();

-- ---------- 5. Realtime ----------
do $$ begin
  alter publication supabase_realtime add table public.pasar_barang;
exception when duplicate_object then null; end $$;
