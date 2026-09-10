-- ============================================================
-- SIGAP migrasi V11 — batasi ukuran dan format foto laporan.
-- Idempoten; aman dijalankan ulang setelah schema.sql.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'foto-laporan',
  'foto-laporan',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "foto_laporan_insert_authenticated" on storage.objects;
create policy "foto_laporan_insert_authenticated" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'foto-laporan'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and lower((storage.extension(name))) in ('png', 'jpg', 'jpeg', 'webp')
  );
