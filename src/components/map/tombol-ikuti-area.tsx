"use client";

import { useState } from "react";
import Link from "next/link";
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
    if (!user) return;
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
      {user ? (
        <Button
          variant={selesai ? "utama" : "sekunder"}
          size="sm"
          onClick={ikuti}
          disabled={proses}
          aria-busy={proses}
          aria-describedby={pesan ? "galat-ikuti-area" : undefined}
          title="Dapatkan notifikasi laporan baru dalam radius 1 km"
        >
          {proses ? (
            <Loader2 size={14} aria-hidden className="animate-spin" />
          ) : selesai ? (
            <Crosshair size={14} aria-hidden />
          ) : (
            <BellPlus size={14} aria-hidden />
          )}
          {selesai ? "Area diikuti" : "Ikuti area"}
        </Button>
      ) : (
        <Link
          href="/masuk?next=/peta"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-ap-hairline bg-ap-canvas px-3.5 py-1.5 text-sm font-semibold text-ap-ink hover:border-ap-blue hover:text-ap-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
          title="Masuk untuk mendapat notifikasi laporan baru dalam radius 1 km"
        >
          <BellPlus size={14} aria-hidden />
          Ikuti area
        </Link>
      )}
      {pesan && (
        <p id="galat-ikuti-area" role="alert" aria-live="assertive" className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
          {pesan}
        </p>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {selesai ? "Area berhasil diikuti." : ""}
      </span>
    </div>
  );
}
