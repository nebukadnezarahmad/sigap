import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, MapPin, Timer, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS, hitungSla, type StatusKey } from "@/lib/constants";
import type { FotoLaporan } from "@/types/database";
import { formatTanggal, waktuRelatif } from "@/lib/utils";
import { Avatar, Card, StatusChip } from "@/components/ui";
import { GalatMuatUlang, KontenUtama } from "@/components/layout-konten";
import { IkonKategori } from "@/lib/ikon-vektor";
import { LeafletMap } from "@/components/map/leaflet-map";
import { VoteButton } from "./vote-button";
import { KomentarSection as Komentar } from "./komentar";
import { KonfirmasiButton } from "./konfirmasi-button";
import { ShareButtons } from "./share-buttons";
import { AdminPanel } from "./admin-panel";
import { SebelumSesudah } from "./sebelum-sesudah";
import { MomenSelesai } from "./momen-selesai";

export const dynamic = "force-dynamic";

export default async function HalamanLaporan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return (
      <KontenUtama>
        <GalatMuatUlang judul="Laporan belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const { data: r, error: galatLaporan } = await supabase
    .from("reports")
    .select(
      `*, lat, lng, categories(slug,nama,warna),
       profiles!reports_user_id_fkey(id,username,nama_lengkap,avatar_url),
       votes(count), comments(count), confirmations(count),
       report_events(id,status,catatan,created_at),
       report_photos(id,url,fase)`
    )
    .eq("id", id)
    .maybeSingle();

  if (galatLaporan) {
    return (
      <KontenUtama>
        <GalatMuatUlang judul="Laporan belum bisa dimuat" />
      </KontenUtama>
    );
  }

  if (!r) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let sudahKonfirmasi = false;
  if (user) {
    const [{ data: p }, { data: k }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("confirmations")
        .select("user_id")
        .eq("report_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    isAdmin = p?.role === "admin";
    sudahKonfirmasi = !!k;
  }

  const kat = r.categories;
  const profilPelapor = Array.isArray(r.profiles)
    ? (r.profiles[0] ?? null)
    : r.profiles;
  const sla = hitungSla(kat?.slug, r.created_at);
  const koordinat: [number, number] = [r.lng ?? 106.816666, r.lat ?? -6.2];
  const semuaFoto = (r.report_photos ?? []) as unknown as FotoLaporan[];
  const fotoSebelum = semuaFoto.filter((f) => f.fase === "sebelum");
  const fotoSesudah = semuaFoto.filter((f) => f.fase === "sesudah");
  // Dedup: foto_url biasanya sama dengan foto "sebelum" pertama (satu
  // unggahan, dua referensi) — bandingkan URL agar tak tampil ganda.
  const urlSebelum = new Set(fotoSebelum.map((f) => f.url));
  const galeri = [
    ...(r.foto_url && !urlSebelum.has(r.foto_url)
      ? [{ id: "utama", url: r.foto_url, fase: "sebelum" as const }]
      : []),
    ...fotoSebelum.map((f) => ({ id: f.id, url: f.url, fase: "sebelum" as const })),
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/peta"
        className="mb-5 inline-flex min-h-[44px] items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={15} /> Buka peta
      </Link>

      {r.status === "selesai" && (
        <MomenSelesai reportId={r.id} awalSelesai />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusChip status={r.status} />
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${kat?.warna}22`,
                  color: kat?.warna,
                }}
              >
                <IkonKategori slug={kat?.slug ?? "lainnya"} ukuran={13} />{" "}
                {kat?.nama ?? "Lainnya"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {r.petugas && (
                <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                  <Wrench size={12} /> {r.petugas}
                </span>
              )}

              {/* Lencana target batas waktu layanan */}
              {r.status !== "selesai" && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    sla.lewatSla
                      ? "bg-danger/15 text-danger font-bold"
                      : "bg-panel-2 text-muted border garis-halus"
                  }`}
                  title={`Target batas waktu layanan kategori: ${sla.targetHari} hari (jatuh tempo: ${formatTanggal(sla.jatuhTempo.toISOString())})`}
                >
                  {sla.lewatSla ? (
                    <>
                      <AlertTriangle size={12} className="text-danger shrink-0" />
                      <span>Lewat batas waktu {sla.hariTerlambat} hari</span>
                    </>
                  ) : (
                    <>
                      <Timer size={12} className="text-muted shrink-0" />
                      <span>Sisa {sla.sisaHari} hari</span>
                    </>
                  )}
                </span>
              )}

              <span className="text-xs text-muted" suppressHydrationWarning>
                {waktuRelatif(r.created_at)}
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight">
              {r.judul}
            </h1>
            <div className="mt-3 flex items-center gap-2.5">
              <Link
                href={`/warga/${profilPelapor?.username ?? ""}`}
                className="flex items-center gap-2.5 transition hover:opacity-80"
              >
                <Avatar
                  nama={profilPelapor?.nama_lengkap ?? "Warga"}
                  url={profilPelapor?.avatar_url}
                  ukuran={32}
                />
                <div className="text-sm">
                  <p className="font-semibold">
                    {profilPelapor?.nama_lengkap ?? "Warga"}
                  </p>
                  <p className="text-xs text-muted">
                    @{profilPelapor?.username}
                  </p>
                </div>
              </Link>
            </div>
          </header>

          {galeri.length > 0 && (
            <div
              className={`grid gap-2 ${
                galeri.length === 1 ? "" : "grid-cols-2"
              }`}
            >
              {galeri.map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={f.id}
                  src={f.url}
                  alt={`Foto kondisi ${r.judul} — sebelum ${i + 1}`}
                  width={800}
                  height={600}
                  className={`w-full rounded-2xl border garis-halus object-cover shadow-sm ${
                    galeri.length === 1 ? "aspect-[4/3] max-h-[420px]" : "aspect-[4/3] h-44 sm:h-52"
                  }`}
                />
              ))}
            </div>
          )}

          <Card className="p-5">
            <p className="whitespace-pre-line leading-relaxed">{r.deskripsi}</p>
            {r.alamat_teks && (
              <p className="mt-3 flex items-center gap-1.5 border-t garis-halus pt-3 text-sm text-muted">
                <MapPin size={13} /> {r.alamat_teks}
              </p>
            )}
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="w-full sm:w-auto sm:min-w-56 [&_button]:w-full">
              <VoteButton
                reportId={r.id}
                jumlahAwal={r.votes?.[0]?.count ?? 0}
              />
            </div>
            <KonfirmasiButton
              reportId={r.id}
              jumlahAwal={r.confirmations?.[0]?.count ?? 0}
              sudahAwal={sudahKonfirmasi}
              masuk={!!user}
              status={r.status as StatusKey}
            />
            <ShareButtons judul={r.judul} />
          </div>

          {fotoSesudah.length > 0 && (
            <Card className="border-daun-500/40 p-5">
              <h2 className="mb-3 flex items-center gap-2 font-display font-bold text-daun-700 dark:text-daun-300">
                <CheckCircle2 size={17} /> Bukti penyelesaian
              </h2>
              {galeri.length > 0 ? (
                <SebelumSesudah
                  sebelum={galeri[0].url}
                  sesudah={fotoSesudah[0].url}
                  judul={r.judul}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {fotoSesudah.map((f, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={f.id}
                      src={f.url}
                      alt={`Foto kondisi ${r.judul} — sesudah ${i + 1}`}
                      width={800}
                      height={600}
                      className="aspect-[4/3] h-44 w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
              {galeri.length > 0 && fotoSesudah.length > 1 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {fotoSesudah.slice(1).map((f, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={f.id}
                      src={f.url}
                      alt={`Foto kondisi ${r.judul} — sesudah ${i + 2}`}
                      width={800}
                      height={600}
                      className="aspect-[4/3] h-36 w-full rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
            </Card>
          )}

          <Komentar reportId={r.id} jumlahAwal={r.comments?.[0]?.count ?? 0} />

          {isAdmin && (
            <AdminPanel
              reportId={r.id}
              statusAwal={r.status}
              petugasAwal={r.petugas ?? ""}
            />
          )}
        </div>

        <aside className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="h-56 w-full">
              <LeafletMap
                mode="satu"
                zoom={16}
                titik={[
                  {
                    id: r.id,
                    lat: koordinat[1],
                    lng: koordinat[0],
                    warna: kat?.warna ?? "#64748b",
                    slug: kat?.slug ?? "lainnya",
                    judul: r.judul,
                  },
                ]}
              />
            </div>
            <p className="px-4 py-2.5 text-center text-xs text-muted">
              {koordinat[0].toFixed(5)}, {koordinat[1].toFixed(5)}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-display font-bold">Linimasa penanganan</h2>
            <ol className="space-y-4">
              {(r.report_events ?? []).length === 0 && (
                <li className="text-sm text-muted">
                  Belum ada update dari dewan.
                </li>
              )}
              {[...(r.report_events ?? [])]
                .sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                )
                .map((ev) => (
                  <li key={ev.id} className="relative pl-6">
                    <span
                      className="absolute left-0 top-1 size-3 rounded-full ring-4 ring-panel"
                      style={{
                        backgroundColor:
                          STATUS[ev.status as StatusKey]?.warna ?? "#94a3b8",
                      }}
                    />
                    <span
                      className="absolute left-[5.5px] top-4 h-[calc(100%+16px)] w-px bg-line"
                      aria-hidden
                    />
                    <p className="text-sm font-semibold">
                      {STATUS[ev.status as StatusKey]?.label ?? ev.status}
                    </p>
                    {ev.catatan && (
                      <p className="mt-0.5 text-sm text-muted">{ev.catatan}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted">
                      {formatTanggal(ev.created_at)}
                    </p>
                  </li>
                ))}
            </ol>
          </Card>

        </aside>
      </div>
    </main>
  );
}
