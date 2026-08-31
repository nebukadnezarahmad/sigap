"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ImagePlus, MapPin, Send, ThumbsUp } from "lucide-react";
import { KATEGORI, STATUS, type StatusKey } from "@/lib/constants";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  { ssr: false }
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
  const [laporanMirip, setLaporanMirip] = useState<LaporanMirip[]>([]);
  const [abaikanDuplikat, setAbaikanDuplikat] = useState(false);

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
          .not("lng", "is", null);

        if (semua && aktif) {
          const cocok: LaporanMirip[] = [];
          for (const r of semua) {
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
      <div className="space-y-4 py-2">
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
            <Button size="sm" variant="sekunder" onClick={() => router.push("/masuk?next=/peta?lapor=1")}>
              Masuk Manual
            </Button>
            <Button size="sm" onClick={() => router.push("/daftar?next=/peta?lapor=1")}>
              Daftar Akun
            </Button>
          </div>
        </div>
      </div>
    );
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setPesan(null);
    const pelapor = user;
    if (!pelapor) return;

    if (!posisi) {
      setPesan("Klik lokasi masalah di peta dulu ya.");
      return;
    }

    setProses(true);
    try {
      const supabase = createClient();
      let foto_url: string | null = null;

      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) throw new Error("Setiap foto maksimal 5 MB.");
      }

      if (files.length > 0) {
        const pertama = files[0];
        const path0 = `${pelapor.id}/${Date.now()}-${pertama.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("foto-laporan")
          .upload(path0, pertama, { contentType: pertama.type });
        if (upErr) throw new Error(`Gagal unggah foto: ${upErr.message}`);
        const { data: pub } = supabase.storage
          .from("foto-laporan")
          .getPublicUrl(path0);
        foto_url = pub.publicUrl;
      }

      const { data: kat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slugKategori)
        .single();

      const { error } = await supabase.from("reports").insert({
        user_id: pelapor.id,
        category_id: kat?.id ?? null,
        judul,
        deskripsi,
        alamat_teks: alamat || null,
        foto_url,
        status: "baru",
        lokasi: `SRID=4326;POINT(${posisi.lng} ${posisi.lat})`,
      });
      if (error) throw new Error(error.message);

      if (files.length > 0) {
        const { data: laporanBaru } = await supabase
          .from("reports")
          .select("id")
          .eq("user_id", pelapor.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (laporanBaru) {
          const baris = await Promise.all(
            files.map(async (f, i) => {
              const path = `${pelapor.id}/${Date.now()}-${i}-${f.name.replace(/[^\w.-]/g, "_")}`;
              const { error: upErr } = await supabase.storage
                .from("foto-laporan")
                .upload(path, f, { contentType: f.type });
              if (upErr) return null;
              const { data: pub } = supabase.storage
                .from("foto-laporan")
                .getPublicUrl(path);
              return {
                report_id: laporanBaru.id,
                url: pub.publicUrl,
                fase: "sebelum",
              };
            })
          );
          const valid = baris.filter(
            (b): b is { report_id: string; url: string; fase: string } => !!b
          );
          if (valid.length > 0) {
            await supabase.from("report_photos").insert(valid);
          }
        }
      }

      selesai();
      router.refresh();
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setProses(false);
    }
  }

  return (
    <form onSubmit={kirim} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-4">
        <div>
          <Label htmlFor="judul">Judul laporan</Label>
          <Input
            id="judul"
            required
            maxLength={120}
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: TPS liar di ujung Jl. Melati"
          />
        </div>
        <div>
          <Label htmlFor="kategori">Kategori</Label>
          <Select
            id="kategori"
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
            required
            rows={4}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Jelaskan kondisi, sudah berapa lama, dan dampaknya bagi warga…"
          />
        </div>
        <div>
          <Label htmlFor="alamat">Patokan alamat (opsional)</Label>
          <Input
            id="alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Depan Masjid Al-Ikhlas, RT 03"
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
            onPilih={(lat, lng) => setPosisi({ lat, lng })}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {posisi
            ? `Titik terpilih: ${posisi.lat.toFixed(5)}, ${posisi.lng.toFixed(5)}`
            : "Belum ada titik dipilih"}
        </p>

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
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleDukungLaporanMirip(laporanMirip[0].id)}
                    className="bg-daun-600 hover:bg-daun-700 text-white"
                  >
                    <ThumbsUp size={12} /> Ikut Dukung (+1 Poin)
                  </Button>
                  <Button
                    size="sm"
                    variant="sekunder"
                    type="button"
                    onClick={() => setAbaikanDuplikat(true)}
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

        <Button type="submit" disabled={proses} size="lg" className="mt-3 w-full">
          <Send size={16} /> {proses ? "Mengirim…" : "Kirim laporan (+10 poin)"}
        </Button>
      </div>
    </form>
  );
}
