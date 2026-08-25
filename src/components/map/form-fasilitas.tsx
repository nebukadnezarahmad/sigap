"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { JENIS_FASILITAS } from "@/lib/constants";
import { useUser } from "@/lib/use-user";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label, Select } from "@/components/ui";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  { ssr: false }
);

const PUSAT_KOTA: [number, number] = [-6.2, 106.816666];

export function FormFasilitas({ selesai }: { selesai: () => void }) {
  const router = useRouter();
  const { user } = useUser();
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState<string>(JENIS_FASILITAS[0].jenis);
  const [alamat, setAlamat] = useState("");
  const [jam, setJam] = useState("");
  const [posisi, setPosisi] = useState<{ lat: number; lng: number } | null>(null);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">Masuk dulu untuk menambah fasilitas.</p>
        <Button onClick={() => router.push("/masuk?next=/peta")}>Masuk</Button>
      </div>
    );
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setPesan(null);
    if (!posisi) {
      setPesan("Klik lokasi fasilitas di peta dulu ya.");
      return;
    }
    setProses(true);
    const pelapor = user;
    if (!pelapor) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("facilities").insert({
        user_id: pelapor.id,
        nama,
        jenis,
        alamat: alamat.trim() || null,
        jam_buka: jam.trim() || null,
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
          <Label htmlFor="f-nama">Nama fasilitas</Label>
          <Input
            id="f-nama"
            required
            maxLength={100}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="cth. Bank Sampah Melati Jaya"
          />
        </div>
        <div>
          <Label htmlFor="f-jenis">Jenis</Label>
          <Select
            id="f-jenis"
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
          >
            {JENIS_FASILITAS.map((f) => (
              <option key={f.jenis} value={f.jenis}>
                {f.nama}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-alamat">Alamat</Label>
          <Input
            id="f-alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Jl. Melati Raya No. 21"
          />
        </div>
        <div>
          <Label htmlFor="f-jam">Jam buka</Label>
          <Input
            id="f-jam"
            value={jam}
            onChange={(e) => setJam(e.target.value)}
            placeholder="Senin–Sabtu 08.00–16.00"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <Label>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} /> Klik peta untuk menandai lokasi
          </span>
        </Label>
        <div className="min-h-56 flex-1 overflow-hidden rounded-xl border garis-halus">
          <LeafletMap
            mode="pilih"
            zoom={14}
            pusat={PUSAT_KOTA}
            titik={
              posisi
                ? [
                    {
                      id: "fas-baru",
                      lat: posisi.lat,
                      lng: posisi.lng,
                      warna: "#0d9488",
                      slug: "lainnya",
                      judul: "Lokasi fasilitas",
                    },
                  ]
                : []
            }
            onPilih={(lat, lng) => setPosisi({ lat, lng })}
          />
        </div>
        {pesan && (
          <p role="alert" className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {pesan}
          </p>
        )}
        <Button type="submit" disabled={proses} className="mt-3 w-full">
          {proses ? "Menyimpan…" : "Simpan fasilitas (+8 poin)"}
        </Button>
      </div>
    </form>
  );
}
