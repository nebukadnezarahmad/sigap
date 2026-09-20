-- migrasi-v12: segarkan tanggal laporan demo agar masuk jendela 14 hari.
--
-- Latar: data seed dibuat ~akhir Agustus 2026 sehingga SEMUA laporan tampil
-- "lewat batas waktu" setelah target SLA diketatkan (<14 hari). Migrasi ini
-- menggeser created_at relatif ke now(), mempertahankan status & isi:
-- 14 laporan masuk SLA masing-masing kategori, 2 laporan disengaja
-- lewat (sampah 5 hari / SLA 3; drainase 10 hari / SLA 7) agar badge
-- keterlambatan tetap terlihat di demo.
-- Idempoten: dijalankan sekali; aman diulang (tanggal dihitung dari now()).

update public.reports set created_at = now() - interval '2 days'  where id = 'e70e2758-cb16-425c-a0d8-ecf83dc9b839'; -- sampah ditolak
update public.reports set created_at = now() - interval '10 days' where id = '5a8fb0ca-9c4e-471e-b067-53df48edfaa3'; -- drainase dikerjakan: LEWAT (10/7)
update public.reports set created_at = now() - interval '5 days'  where id = 'ae3e80a5-782d-4873-8deb-28a16ff546ac'; -- sampah dikerjakan: LEWAT (5/3)
update public.reports set created_at = now() - interval '4 days'  where id = '6ec2e8ba-88d8-4b14-be67-087bd2be7b17'; -- jalan dikerjakan (4/10)
update public.reports set created_at = now() - interval '3 days'  where id = 'a254559c-f19f-49c5-a5c6-efea3ae796ba'; -- lampu diverifikasi (3/7)
update public.reports set created_at = now() - interval '2 days'  where id = '0bb84155-40a5-4a99-9c11-37717a18a445'; -- drainase dikerjakan (2/7)
update public.reports set created_at = now() - interval '1 day'   where id = 'a5ef17a8-d946-4ca7-b352-7046ce8d318a'; -- sampah diverifikasi (1/3)
update public.reports set created_at = now() - interval '6 days'  where id = '0fd2c438-b675-4fcd-ad1f-0989a974fd6a'; -- lainnya baru (6/10)
update public.reports set created_at = now() - interval '5 days'  where id = 'bc5da64d-ae28-4756-8b5f-dbfdccc60d91'; -- ruang-hijau baru (5/12)
update public.reports set created_at = now() - interval '8 days'  where id = 'd5467731-0cb8-452c-a3f0-ac52b5d9f674'; -- ruang-hijau selesai (8/12)
update public.reports set created_at = now() - interval '1 day'   where id = '604ebc78-9c77-4221-8798-a44d72e805ef'; -- jalan baru (1/10)
update public.reports set created_at = now() - interval '6 days'  where id = '9cf7052e-4cc8-4683-b437-10dc39c71f51'; -- jalan selesai (6/10)
update public.reports set created_at = now() - interval '5 days'  where id = '4dfafe6a-cf26-46b9-bb4c-ffdd732824d3'; -- lampu diverifikasi (5/7)
update public.reports set created_at = now() - interval '2 days'  where id = '83b606e1-d053-4456-85a4-065496d44329'; -- lampu selesai (2/7)
update public.reports set created_at = now() - interval '0 days'  where id = '28975999-daff-49be-9814-732e0b6d886b'; -- drainase baru (hari ini)
update public.reports set created_at = now() - interval '0 days'  where id = 'c7b29ff6-cbbb-4945-b6c7-918b733140fa'; -- sampah baru (hari ini)
