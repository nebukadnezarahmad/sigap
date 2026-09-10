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
  const linimasa = [...(r.report_events ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <Link
        href="/peta"
        className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={15} /> Buka peta
      </Link>

      {r.status === "selesai" && (
        <MomenSelesai reportId={r.id} awalSelesai />
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <article className="min-w-0 space-y-7 lg:col-start-1 lg:row-start-1">
          <header>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <StatusChip status={r.status} />
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: `${kat?.warna}22`,
                  color: kat?.warna,
                }}
              >
                <IkonKategori slug={kat?.slug ?? "lainnya"} ukuran={13} />{" "}
                 {kat?.nama ?? "Lainnya"}
               </span>
              <time
                dateTime={r.created_at}
                className="text-xs font-medium text-muted"
                suppressHydrationWarning
              >
                {waktuRelatif(r.created_at)}
              </time>
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-[1.12] tracking-tight sm:text-4xl">
              {r.judul}
            </h1>

            <div className="mt-5 grid gap-4 border-y garis-halus py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <Link
                href={`/warga/${profilPelapor?.username ?? ""}`}
                className="flex min-h-[44px] min-w-0 items-center gap-3 rounded-lg transition hover:opacity-80 focus-visible:outline-offset-4"
              >
                <Avatar
                  nama={profilPelapor?.nama_lengkap ?? "Warga"}
                  url={profilPelapor?.avatar_url}
                  ukuran={32}
                />
                <div className="min-w-0 text-sm">
                  <p className="text-xs text-muted">Dilaporkan oleh</p>
                  <p className="font-semibold">
                    {profilPelapor?.nama_lengkap ?? "Warga"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    @{profilPelapor?.username}
                  </p>
                </div>
              </Link>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:justify-self-end">
                <div>
                  <dt className="text-xs text-muted">Ditangani oleh</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                    <Wrench size={14} className="shrink-0 text-muted" aria-hidden="true" />
                    <span>{r.petugas ?? "Belum ditugaskan"}</span>
                  </dd>
                </div>
                {r.status !== "selesai" && (
                  <div>
                    <dt className="text-xs text-muted">Batas waktu layanan</dt>
                    <dd
                      className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${
                        sla.lewatSla ? "text-danger" : "text-ink"
                      }`}
                      title={`Target kategori ${sla.targetHari} hari, jatuh tempo ${formatTanggal(sla.jatuhTempo.toISOString())}`}
                    >
                      {sla.lewatSla ? (
                        <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
                      ) : (
                        <Timer size={14} className="shrink-0 text-muted" aria-hidden="true" />
                      )}
                      <span>
                        {sla.lewatSla
                          ? `Terlambat ${sla.hariTerlambat} hari`
                          : `Tersisa ${sla.sisaHari} hari`}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
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

          <section
            aria-labelledby="detail-laporan"
            className="rounded-2xl border garis-halus bg-panel p-5 sm:p-6"
          >
            <h2 id="detail-laporan" className="sr-only">
              Detail laporan
            </h2>
            <p className="whitespace-pre-line text-[1.02rem] leading-7">
              {r.deskripsi}
            </p>
            {r.alamat_teks && (
              <p className="mt-5 flex items-start gap-2 border-t garis-halus pt-4 text-sm leading-6 text-muted">
                <MapPin size={15} className="mt-1 shrink-0" aria-hidden="true" />
                <span>{r.alamat_teks}</span>
              </p>
            )}
          </section>

          <div
            role="group"
            aria-label="Aksi laporan"
            className="rounded-2xl border garis-halus bg-panel p-3 sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
                <VoteButton
                  reportId={r.id}
                  jumlahAwal={r.votes?.[0]?.count ?? 0}
                />
              </div>
              <div className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
                <KonfirmasiButton
                  reportId={r.id}
                  jumlahAwal={r.confirmations?.[0]?.count ?? 0}
                  sudahAwal={sudahKonfirmasi}
                  masuk={!!user}
                  status={r.status as StatusKey}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3 border-t garis-halus pt-3 sm:flex-row sm:items-center sm:justify-between">
              {!user && (
                <p className="text-xs leading-5 text-muted">
                  Masuk untuk memberi dukungan, mengonfirmasi kondisi, atau ikut berdiskusi.
                </p>
              )}
              <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-start">
                <span className="text-xs font-medium text-muted">Bagikan</span>
                <ShareButtons judul={r.judul} />
              </div>
            </div>
          </div>

          {fotoSesudah.length > 0 && (
            <Card className="border-daun-500/40 p-5">
              <h2 className="mb-3 flex items-center gap-2 font-display font-semibold text-daun-700 dark:text-daun-300">
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

        </article>

        <aside
          aria-label="Lokasi dan penanganan laporan"
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <Card className="overflow-hidden p-0">
            <section aria-labelledby="lokasi-laporan" className="p-4">
              <h2 id="lokasi-laporan" className="font-display text-lg font-semibold">
                Lokasi laporan
              </h2>
              {r.alamat_teks && (
                <p className="mt-1 text-sm leading-5 text-muted">{r.alamat_teks}</p>
              )}
              <div className="mt-4 h-52 w-full overflow-hidden rounded-xl border garis-halus">
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
              <p className="mt-2 angka-tabular text-xs text-muted">
                Koordinat {koordinat[0].toFixed(5)}, {koordinat[1].toFixed(5)}
              </p>
            </section>

            <section
              aria-labelledby="linimasa-penanganan"
              className="border-t garis-halus p-5"
            >
              <h2 id="linimasa-penanganan" className="font-display text-xl font-semibold">
                Linimasa penanganan
              </h2>
              <ol className="mt-5 space-y-5">
                {linimasa.length === 0 && (
                  <li className="text-sm text-muted">
                    Belum ada pembaruan penanganan.
                  </li>
                )}
                {linimasa.map((ev, idx) => {
                  const terbaru = idx === linimasa.length - 1;
                  return (
                    <li key={ev.id} className="relative pl-7">
                      {terbaru && (
                        <p className="mb-1 text-xs font-semibold text-action">
                          Pembaruan terbaru
                        </p>
                      )}
                      <span
                        className={`absolute left-0 size-3 rounded-full ring-4 ring-panel ${
                          terbaru ? "top-6" : "top-1"
                        }`}
                        style={{
                          backgroundColor:
                            STATUS[ev.status as StatusKey]?.warna ?? "#94a3b8",
                        }}
                      />
                      {idx < linimasa.length - 1 && (
                        <span
                          className="absolute left-[5.5px] top-4 h-[calc(100%+16px)] w-px bg-line"
                          aria-hidden="true"
                        />
                      )}
                      <p
                        className={`text-sm font-semibold ${
                          terbaru ? "text-ink" : "text-muted"
                        }`}
                      >
                        {STATUS[ev.status as StatusKey]?.label ?? ev.status}
                      </p>
                      {ev.catatan && (
                        <p className="mt-1 text-sm leading-5 text-muted">
                          {ev.catatan}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted">
                        {formatTanggal(ev.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          </Card>
        </aside>

        <div className="space-y-7 lg:col-start-1 lg:row-start-2">
          <Komentar reportId={r.id} jumlahAwal={r.comments?.[0]?.count ?? 0} />

          {isAdmin && (
            <AdminPanel
              reportId={r.id}
              statusAwal={r.status}
              petugasAwal={r.petugas ?? ""}
            />
          )}
        </div>
      </div>
    </main>
  );
}
