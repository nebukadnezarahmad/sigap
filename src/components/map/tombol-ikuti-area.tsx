"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellPlus, Crosshair, Loader2 } from "lucide-react";
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

  async function ikuti() {
    if (!user) {
      window.location.assign("/masuk?next=/peta");
      return;
    }
    setProses(true);
    setPesan(null);

    const titik = pusatSaya ?? (await ambilLokasi());
    if (!titik) {
      setPesan("Izinkan akses lokasi, atau aktifkan 'Sekitar saya' dulu.");
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
      setPesan(error.message);
      return;
    }
    setSelesai(true);
    router.refresh();
  }

  async function ambilLokasi(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
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
        disabled={proses}
        title="Dapatkan notifikasi laporan baru dalam radius 1 km"
      >
        {proses ? (
          <Loader2 size={14} className="animate-spin" />
        ) : selesai ? (
          <Crosshair size={14} />
        ) : (
          <BellPlus size={14} />
        )}
        {selesai ? "Area diikuti" : "Ikuti area"}
      </Button>
      {pesan && (
        <p role="alert" className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
          {pesan}
        </p>
      )}
    </div>
  );
}
