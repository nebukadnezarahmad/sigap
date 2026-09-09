"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellPlus, Crosshair } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { Button } from "@/components/ui";

export function TombolIkutiArea({
  pusatSaya,
}: {
  pusatSaya: { lat: number; lng: number } | null;
}) {
  const { user } = useUser();
  const router = useRouter();
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [selesai, setSelesai] = useState(false);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);

  async function ikuti() {
    if (!user) {
      router.push("/masuk?next=/peta");
      return;
    }
    if (selesai || proses) return;
    setProses(true);
    setPesan(null);

    const titik = pusatSaya ?? (await ambilLokasi());
    if (!titik) {
      setPesan(pesanLokasi ?? "Aktifkan 'Sekitar saya' dulu, lalu coba lagi.");
      setProses(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("area_follows").insert({
      user_id: user.id,
      label: `Radius 1 km (${titik.lat.toFixed(3)}, ${titik.lng.toFixed(3)})`,
      lokasi: `SRID=4326;POINT(${titik.lng} ${titik.lat})`,
      radius_m: 1000,
    });
    setProses(false);
    if (error) {
      console.error("Gagal mengikuti area:", error);
      setPesan("Data belum dapat disimpan. Periksa koneksi lalu coba lagi.");
      return;
    }
    setSelesai(true);
    router.refresh();
  }

  async function ambilLokasi(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setPesanLokasi("Perambanmu tidak mendukung geolokasi. Aktifkan 'Sekitar saya' dulu.");
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPesanLokasi("Akses lokasi ditolak. Izinkan akses lokasi di peramban, atau aktifkan 'Sekitar saya' dulu.");
          } else if (err.code === err.TIMEOUT) {
            setPesanLokasi("Pengambilan lokasi kehabisan waktu. Periksa koneksi lalu coba lagi.");
          } else {
            setPesanLokasi("Lokasi tidak tersedia saat ini. Aktifkan 'Sekitar saya' dulu.");
          }
          resolve(null);
        },
        { timeout: 8000 }
      );
    });
  }

  return (
    <div className="relative">
      <Button
        variant={selesai ? "utama" : "sekunder"}
        size="sm"
        onClick={ikuti}
        disabled={proses || selesai}
        loading={proses}
        loadingLabel="Mengikuti…"
        title={
          selesai
            ? "Kamu sudah mengikuti area ini"
            : "Dapatkan notifikasi laporan baru dalam radius 1 km"
        }
        aria-live="polite"
      >
        {selesai ? (
          <Crosshair size={14} />
        ) : (
          <BellPlus size={14} />
        )}
        {selesai ? "Mengikuti area ini" : "Ikuti area"}
      </Button>
      {pesan && (
        <p role="alert" className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
          {pesan}
        </p>
      )}
    </div>
  );
}
