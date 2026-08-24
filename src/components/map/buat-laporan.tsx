"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, MapPin, Send } from "lucide-react";
import { KATEGORI } from "@/lib/constants";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  { ssr: false }
);

const PUSAT_KOTA: [number, number] = [-6.2, 106.816666];

export function BuatLaporanFormulir({ selesai }: { selesai: () => void }) {
  const router = useRouter();
  const { user } = useUser();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [slugKategori, setSlugKategori] = useState(KATEGORI[0].slug);
  const [alamat, setAlamat] = useState("");
  const [posisi, setPosisi] = useState<{ lat: number; lng: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          Kamu harus masuk dulu untuk melaporkan masalah — supaya setiap laporan
          bisa dipertanggungjawabkan.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => router.push("/masuk?next=/peta")}>Masuk</Button>
          <Button variant="sekunder" onClick={() => router.push("/daftar?next=/peta")}>
            Daftar
          </Button>
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

      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Foto maksimal 5 MB.");
        const path = `${pelapor.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("foto-laporan")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw new Error(`Gagal unggah foto: ${upErr.message}`);
        const { data: pub } = supabase.storage
          .from("foto-laporan")
          .getPublicUrl(path);
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
                {k.emoji} {k.nama}
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
          <Label htmlFor="foto">Foto (opsional)</Label>
          <label
            htmlFor="foto"
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed garis-halus px-3.5 py-3 text-sm text-muted transition hover:border-daun-400 hover:text-ink"
          >
            <ImagePlus size={18} />
            {file ? file.name : "Pilih foto kondisi terbaru…"}
            <input
              id="foto"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
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
                      emoji: "📍",
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
