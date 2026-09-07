"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ImagePlus, Loader2, MapPin, Send, ThumbsUp } from "lucide-react";
import { KATEGORI, STATUS, type StatusKey } from "@/lib/constants";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { KacaKartu, KacaPill } from "@/components/eksperimen/kaca";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

/* Fusi visual-fusion: isi modal sebagai panel frosted (backdrop-blur 20px +
   saturate 180%, edge terang) tanpa shadow berat — scrim backdrop milik
   Modal tidak disentuh. Tombol Kirim/Dukung pill Action Blue 44px.
   Copy, pesan error, role/aria, dan logika validasi/kirim tidak diubah. */
const GAYA_FROSTED: CSSProperties = {
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
};
const PANEL_FROSTED =
  "rounded-[18px] border border-white/40 bg-white/60 shadow-none backdrop-blur-[20px] backdrop-saturate-[180%] dark:border-white/15 dark:bg-[#131d19]/55";
const PILL_BIRU =
  "min-h-[44px] border-transparent bg-ap-blue text-white hover:bg-ap-blue-focus focus-visible:outline-ap-blue-focus dark:border-transparent dark:bg-ap-blue dark:text-white dark:hover:bg-ap-blue-focus";
const SENTUH_44 = "min-h-[44px] focus-visible:outline-ap-blue-focus";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <p role="status" aria-label="Memuat peta" className="flex h-full min-h-64 items-center justify-center p-6 text-sm text-muted">
        Memuat peta…
      </p>
    ),
  }
);

const PUSAT_KOTA: [number, number] = [-6.2, 106.816666];

function hitungJarakMeter(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type LaporanMirip = {
  id: string;
  judul: string;
  jarak_m: number;
  vote_count: number;
  status: string;
};

export function BuatLaporanFormulir({ selesai }: { selesai: () => void }) {
  const router = useRouter();
  const { user } = useUser();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [slugKategori, setSlugKategori] = useState(KATEGORI[0].slug);
  const [alamat, setAlamat] = useState("");
  const [posisi, setPosisi] = useState<{ lat: number; lng: number } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [galatJudul, setGalatJudul] = useState<string | null>(null);
  const [galatDeskripsi, setGalatDeskripsi] = useState<string | null>(null);
  const [galatPeta, setGalatPeta] = useState<string | null>(null);
  const [laporanMirip, setLaporanMirip] = useState<LaporanMirip[]>([]);
  const [abaikanDuplikat, setAbaikanDuplikat] = useState(false);

  const kotor =
    judul.trim() !== "" ||
    deskripsi.trim() !== "" ||
    alamat.trim() !== "" ||
    files.length > 0 ||
    posisi !== null;

  // Proteksi draf hilang: peringatkan bila tab ditutup saat formulir kotor
  useEffect(() => {
    if (!kotor) return;
    function saatTutup(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", saatTutup);
    return () => window.removeEventListener("beforeunload", saatTutup);
  }, [kotor]);

  function mintaTutup() {
    if (kotor && !proses) {
      const yakin = window.confirm("Draf laporan belum terkirim. Tutup dan buang draf?");
      if (!yakin) return;
    }
    selesai();
  }

  // Cek duplikasi saat posisi atau kategori berubah
  useEffect(() => {
    if (!posisi) return;
    let aktif = true;
    const supabase = createClient();

    async function cek() {
      if (!posisi) return;
      try {
        const { data: kat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", slugKategori)
          .single();

        // 1. Coba RPC database jika tersedia
        const { data: rpcData, error: rpcErr } = await supabase.rpc(
          "laporan_mirip",
          {
            p_lat: posisi.lat,
            p_lng: posisi.lng,
            p_category_id: kat?.id ?? null,
            p_radius_m: 100,
          }
        );

        if (!rpcErr && rpcData && rpcData.length > 0) {
          if (aktif) {
            setLaporanMirip(rpcData);
            setAbaikanDuplikat(false);
          }
          return;
        }

        // 2. Fallback query ke reports aktif terdekat
        const { data: semua } = await supabase
          .from("reports")
          .select("id, judul, lat, lng, status, category_id, votes(count)")
          .in("status", ["baru", "diverifikasi", "dikerjakan", "menunggu_verifikasi"])
          .not("lat", "is", null)
          .not("lng", "is", null)
          .limit(50);

        if (semua && aktif) {
          const cocok: LaporanMirip[] = [];
          for (const r of semua) {
            if (kat?.id && r.category_id !== kat.id) continue;
            if (r.lat == null || r.lng == null) continue;
            const jarak = hitungJarakMeter(posisi, { lat: r.lat, lng: r.lng });
            if (jarak <= 100) {
              const count = r.votes?.[0]?.count ?? 0;
              cocok.push({
                id: r.id,
                judul: r.judul,
                jarak_m: jarak,
                vote_count: count,
                status: r.status,
              });
            }
          }
          cocok.sort((a, b) => a.jarak_m - b.jarak_m);
          setLaporanMirip(cocok);
          setAbaikanDuplikat(false);
        }
      } catch {
        /* abaikan error cek */
      }
    }

    void cek();
    return () => {
      aktif = false;
    };
  }, [posisi, slugKategori]);

  async function handleDukungLaporanMirip(id: string) {
    if (!user) return;
    setProses(true);
    try {
      const supabase = createClient();
      await supabase.from("votes").upsert(
        { report_id: id, user_id: user.id },
        { onConflict: "report_id,user_id" }
      );
      selesai();
      router.push(`/laporan/${id}`);
    } catch {
      selesai();
      router.push(`/laporan/${id}`);
    }
  }

  if (!user) {
    return (
      <KacaKartu className="space-y-4 p-4">
        <div className="text-center">
          <p className="font-display font-bold text-base">
            Masuk untuk Melaporkan Masalah
          </p>
          <p className="mt-1 text-sm text-muted">
            Setiap laporan diikat dengan akun warga agar validitas dan poin partisipasi dapat tercatat.
          </p>
        </div>

        <div className="rounded-2xl border border-daun-500/30 bg-daun-500/5 p-4">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-daun-700 dark:text-daun-300">
            Masuk Cepat Mode Demo (1-Klik untuk Juri)
          </p>
          <PilihanAkunDemo ringkas />
        </div>

        <div className="flex items-center justify-between border-t garis-halus pt-3 text-xs text-muted">
          <span>Punya akun sendiri?</span>
          <div className="flex gap-2">
            <Button size="sm" variant="sekunder" onClick={() => router.push("/masuk?next=/peta?lapor=1")} className={SENTUH_44}>
              Masuk Manual
            </Button>
            <Button size="sm" onClick={() => router.push("/daftar?next=/peta?lapor=1")} className={`${SENTUH_44} bg-ap-blue text-white shadow-none hover:bg-ap-blue-focus hover:shadow-none focus-visible:outline-ap-blue-focus`}>
              Daftar Akun
            </Button>
          </div>
        </div>
      </KacaKartu>
    );
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setPesan(null);
    setGalatJudul(null);
    setGalatDeskripsi(null);
    setGalatPeta(null);
    const pelapor = user;
    if (!pelapor) return;

    let fokusId: string | null = null;
    if (judul.trim().length < 10) {
      setGalatJudul("Judul minimal 10 karakter. Tulis ringkasan masalah secara spesifik.");
      fokusId ??= "judul";
    }
    if (deskripsi.trim().length < 20) {
      setGalatDeskripsi("Deskripsi minimal 20 karakter. Jelaskan kondisi, durasi, dan dampaknya.");
      fokusId ??= "deskripsi";
    }
    if (!posisi) {
      setGalatPeta("Klik lokasi masalah di peta dulu, lalu kirim lagi.");
      fokusId ??= "peta-pilih";
    }
    if (fokusId) {
      document.getElementById(fokusId)?.focus();
      return;
    }
    if (!posisi) return;

    if (
      posisi.lat < -90 ||
      posisi.lat > 90 ||
      posisi.lng < -180 ||
      posisi.lng > 180
    ) {
      setGalatPeta("Koordinat di luar jangkauan (lat -90..90, lng -180..180). Geser titik di peta lalu coba lagi.");
      document.getElementById("peta-pilih")?.focus();
      return;
    }

    setProses(true);
    try {
      const supabase = createClient();

      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) throw new Error("Setiap foto maksimal 5 MB. Pilih foto lebih kecil lalu coba lagi.");
      }

      // Unggah sekali per file langsung ke report_photos;
      // foto pertama juga dipakai sebagai foto_url (satu upload, dua referensi).
      const urls: string[] = [];
      for (const [i, f] of files.entries()) {
        const path = `${pelapor.id}/${Date.now()}-${i}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("foto-laporan")
          .upload(path, f, { contentType: f.type });
        if (upErr) throw new Error(`Gagal unggah foto: ${upErr.message} Periksa koneksi lalu coba lagi.`);
        const { data: pub } = supabase.storage
          .from("foto-laporan")
          .getPublicUrl(path);
        urls.push(pub.publicUrl);
      }
      const foto_url: string | null = urls[0] ?? null;

      const { data: kat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slugKategori)
        .single();

      const { data: inserted, error } = await supabase
        .from("reports")
        .insert({
          user_id: pelapor.id,
          category_id: kat?.id ?? null,
          judul,
          deskripsi,
          alamat_teks: alamat || null,
          foto_url,
          status: "baru",
          lokasi: `SRID=4326;POINT(${posisi.lng} ${posisi.lat})`,
        })
        .select("id")
        .single();
      if (error) throw new Error(`${error.message} Periksa koneksi lalu coba lagi.`);

      if (urls.length > 0 && inserted) {
        const baris = urls.map((url) => ({
          report_id: inserted.id,
          url,
          fase: "sebelum",
        }));
        await supabase.from("report_photos").insert(baris);
      }

      selesai();
      router.refresh();
    } catch (err) {
      setPesan(err instanceof Error ? `${err.message} Periksa koneksi lalu coba lagi.` : "Terjadi kesalahan. Periksa koneksi lalu coba lagi.");
    } finally {
      setProses(false);
    }
  }

  return (
    <form onSubmit={kirim} style={GAYA_FROSTED} className={`${PANEL_FROSTED} grid gap-5 p-4 sm:grid-cols-2 sm:p-5`}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="judul">Judul laporan</Label>
          <Input
            id="judul"
            name="judul"
            autoComplete="off"
            required
            maxLength={120}
            value={judul}
            onChange={(e) => {
              setJudul(e.target.value);
              if (galatJudul) setGalatJudul(null);
            }}
            placeholder="Contoh: TPS liar di ujung Jl. Melati…"
            aria-invalid={!!galatJudul}
            aria-describedby={galatJudul ? "galat-judul" : undefined}
          />
          {galatJudul && (
            <p id="galat-judul" role="alert" className="mt-1.5 text-xs font-semibold text-danger">
              {galatJudul}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="kategori">Kategori</Label>
          <Select
            id="kategori"
            name="kategori"
            value={slugKategori}
            onChange={(e) => setSlugKategori(e.target.value)}
          >
            {KATEGORI.map((k) => (
              <option key={k.slug} value={k.slug}>
                {k.nama}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="deskripsi">Deskripsi</Label>
          <Textarea
            id="deskripsi"
            name="deskripsi"
            autoComplete="off"
            required
            rows={4}
            value={deskripsi}
            onChange={(e) => {
              setDeskripsi(e.target.value);
              if (galatDeskripsi) setGalatDeskripsi(null);
            }}
            placeholder="Contoh: tumpukan sampah menutup setengah jalan sejak 3 hari…"
            aria-invalid={!!galatDeskripsi}
            aria-describedby={galatDeskripsi ? "galat-deskripsi" : undefined}
          />
          {galatDeskripsi && (
            <p id="galat-deskripsi" role="alert" className="mt-1.5 text-xs font-semibold text-danger">
              {galatDeskripsi}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="alamat">Patokan alamat (opsional)</Label>
          <Input
            id="alamat"
            name="alamat"
            autoComplete="street-address"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Contoh: depan Masjid Al-Ikhlas, RT 03…"
          />
        </div>
        <div>
          <Label htmlFor="foto">Foto kondisi (maks. 4, opsional)</Label>
          <label
            htmlFor="foto"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed garis-halus px-3.5 py-3 text-sm text-muted transition hover:border-daun-400 hover:text-ink"
          >
            <ImagePlus size={18} />
            {files.length > 0
              ? `${files.length} foto dipilih`
              : "Pilih foto kondisi terbaru…"}
            <input
              id="foto"
              name="foto"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) =>
                setFiles(Array.from(e.target.files ?? []).slice(0, 4))
              }
            />
          </label>
          {files.length > 0 && (
            <div className="mt-2 flex gap-2">
              {files.map((f, i) => (
                <span
                  key={i}
                  className="max-w-36 truncate rounded-lg bg-panel-2 px-2 py-1 text-xs text-muted"
                >
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <Label>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} /> Klik peta untuk menandai titik masalah
          </span>
        </Label>
        <div className="min-h-64 flex-1 overflow-hidden rounded-xl border garis-halus">
          <div id="peta-pilih" tabIndex={-1} className="h-full focus:outline-none">
            <LeafletMap
              mode="pilih"
              zoom={15}
              pusat={PUSAT_KOTA}
              titik={
                posisi
                  ? [
                      {
                        id: "baru",
                        lat: posisi.lat,
                        lng: posisi.lng,
                        warna:
                          KATEGORI.find((k) => k.slug === slugKategori)?.warna ??
                          "#64748b",
                        slug: slugKategori,
                        judul: "Lokasi laporanmu",
                      },
                    ]
                  : []
              }
              onPilih={(lat, lng) => {
                setPosisi({ lat, lng });
                if (galatPeta) setGalatPeta(null);
              }}
            />
          </div>
        </div>
        {galatPeta ? (
          <p role="alert" className="mt-1.5 text-xs font-semibold text-danger">
            {galatPeta}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted">
            {posisi
              ? `Titik terpilih: ${posisi.lat.toFixed(5)}, ${posisi.lng.toFixed(5)}`
              : "Belum ada titik dipilih"}
          </p>
        )}

        {/* Kartu Peringatan Deduplikasi Cerdas */}
        {laporanMirip.length > 0 && !abaikanDuplikat && (
          <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-left">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Laporan Serupa Ditemukan ({Math.round(laporanMirip[0].jarak_m)} m dari titikmu)
                </p>
                <p className="mt-1 text-sm font-semibold truncate text-ink">
                  {laporanMirip[0].judul}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {laporanMirip[0].vote_count} dukungan warga · Status: {STATUS[laporanMirip[0].status as StatusKey]?.label ?? laporanMirip[0].status}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <KacaPill
                    type="button"
                    onClick={() => handleDukungLaporanMirip(laporanMirip[0].id)}
                    className={PILL_BIRU}
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <ThumbsUp size={12} /> Dukung laporan ini
                    </span>
                  </KacaPill>
                  <Button
                    size="sm"
                    variant="sekunder"
                    type="button"
                    onClick={() => setAbaikanDuplikat(true)}
                    className={SENTUH_44}
                  >
                    Ini Masalah Berbeda
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {pesan && (
          <p role="alert" className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {pesan}
          </p>
        )}

        <div className="mt-3 flex w-full flex-col gap-2">
          <KacaPill type="submit" disabled={proses} aria-busy={proses} className={`${PILL_BIRU} w-full px-7 py-3 text-base`}>
            <span className="inline-flex items-center gap-2">
              {proses ? (
                <Loader2 size={16} aria-hidden className="animate-spin" />
              ) : (
                <Send size={16} aria-hidden />
              )}
              {proses ? "Mengirim laporan…" : "Kirim laporan (+10 poin)"}
            </span>
          </KacaPill>
          <Button type="button" variant="sekunder" onClick={mintaTutup} disabled={proses} className={`${SENTUH_44} w-full`}>
            Batal
          </Button>
        </div>
      </div>
    </form>
  );
}
