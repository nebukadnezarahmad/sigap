-- ============================================================
-- SIGAP migrasi V10 — RPC tolak_verifikasi untuk tombol "Masalah Belum Beres".
-- Latar: guard_report_owner_edit (v7) menolak SETIAP update laporan saat
-- old.status <> 'baru', sehingga tolakVerifikasi client (update langsung
-- sebagai warga) selalu gagal diam-diam — bahkan oleh pemilik laporan.
-- RPC ini jalur sistem resmi penolakan, sepasang dengan konfirmasi_laporan.
-- Idempotent: CREATE OR REPLACE; aman dijalankan ulang.
-- ============================================================

create or replace function public.tolak_verifikasi(p_report_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_status public.report_status;
begin
  if auth.uid() is null then
    raise exception 'harus login untuk menolak verifikasi';
  end if;

  perform pg_advisory_xact_lock(hashtext('tolak:' || p_report_id::text));

  select status into v_status
  from public.reports
  where id = p_report_id;

  if v_status is distinct from 'menunggu_verifikasi' then
    raise exception 'penolakan hanya berlaku saat status menunggu verifikasi';
  end if;

  perform set_config('app.bypass_owner_guard', 'on', true);
  update public.reports
  set status = 'dikerjakan'
  where id = p_report_id and status = 'menunggu_verifikasi';

  insert into public.comments (report_id, user_id, isi)
  values (
    p_report_id,
    auth.uid(),
    '⚠️ Verifikasi penutupan ditolak warga: Masalah belum sepenuhnya terselesaikan di lapangan.'
  );

  insert into public.report_events (report_id, status, catatan, actor_id)
  values (p_report_id, 'dikerjakan', 'Verifikasi ditolak warga, kembali dikerjakan', auth.uid());

  return jsonb_build_object('ditolak', true);
end;
$$;

grant execute on function public.tolak_verifikasi(uuid) to authenticated;
