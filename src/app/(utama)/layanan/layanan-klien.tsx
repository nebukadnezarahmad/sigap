"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Ambulance,
  Droplets,
  Leaf,
  MessageCircle,
  Phone,
  Recycle,
  Search,
  Shield,
  TriangleAlert,
} from "lucide-react";
import { Button, Card, Skeleton } from "@/components/ui";
import { KacaKartu } from "@/components/eksperimen/kaca";

type Layanan = {
  id: string;
  nama: string;
  kategori: string;
  telepon: string;
  bisaWa: boolean;
  alamat: string | null;
  jam: string;
};

const KATEGORI_META: Record<string, { label: string; Ikon: typeof Leaf }> = {
  darurat: { label: "Darurat", Ikon: Ambulance },
  kesehatan: { label: "Kesehatan", Ikon: Ambulance },
  keamanan: { label: "Keamanan", Ikon: Shield },
  lingkungan: { label: "Lingkungan", Ikon: Recycle },
  utilitas: { label: "Utilitas", Ikon: Droplets },
};

function nomorWa(telepon: string) {
  const digit = telepon.replace(/\D/g, "");
  if (digit.startsWith("62")) return digit;
  if (digit.startsWith("0")) return `62${digit.slice(1)}`;
  return null;
}

/* State layanan: ikon pencarian relevan dengan direktori, segitiga
   relevan dengan gangguan. Skeleton daftar tanpa shimmer. */
export function MuatLayanan() {
  return (
    <div aria-busy="true" className="space-y-3">
      <p role="status" className="sr-only">
        Memuat direktori layanan
      </p>
      <Skeleton className="h-[44px] w-full rounded-full" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-[18px] border border-ap-hairline bg-white p-4 shadow-none dark:border-line dark:bg-panel"
        >
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-2 h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function GalatLayanan() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <Card className="rounded-[18px] border-ap-hairline bg-white p-8 text-ap-ink shadow-none dark:border-line dark:bg-panel dark:text-ink">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-danger/10 text-danger">
          <TriangleAlert size={26} strokeWidth={1.8} />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-[-0.224px]">
          Direktori Layanan belum bisa dimuat
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Kamu tidak kehilangan kontak penting. Daftar layanan gagal dimuat
          karena koneksi terputus.
        </p>
        <ol className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted">
          <li>1. Periksa koneksi internet kamu.</li>
          <li>2. Pilih Coba lagi di bawah.</li>
          <li>3. Untuk keadaan darurat, hubungi 112 langsung.</li>
        </ol>
        <Button className="mt-6 min-h-[44px] focus-visible:outline-ap-blue-focus" onClick={() => router.refresh()}>
          Coba lagi
        </Button>
      </Card>
    </main>
  );
}

export function LayananKlien({ awal }: { awal: Layanan[] }) {
  const [kueri, setKueri] = useState("");

  const tampil = useMemo(() => {
    const q = kueri.trim().toLowerCase();
    if (!q) return awal;
    return awal.filter(
      (l) =>
        l.nama.toLowerCase().includes(q) ||
        l.kategori.toLowerCase().includes(q) ||
        l.telepon.includes(q)
    );
  }, [awal, kueri]);

  const grup = useMemo(() => {
    const map = new Map<string, Layanan[]>();
    for (const l of tampil) {
      const arr = map.get(l.kategori) ?? [];
      arr.push(l);
      map.set(l.kategori, arr);
    }
    return [...map.entries()];
  }, [tampil]);

  return (
    <div>
      <div className="relative mb-6">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={kueri}
          onChange={(e) => setKueri(e.target.value)}
          placeholder="Cari layanan… (mis. damkar, PLN, sampah)"
          aria-label="Cari layanan"
          className="h-[44px] w-full rounded-full border border-ap-hairline bg-white py-3 pl-11 pr-5 text-sm text-ap-ink outline-none transition placeholder:text-muted/70 focus:border-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:border-line dark:bg-panel dark:text-ink"
        />
      </div>

      <div className="space-y-8">
        {grup.map(([kategori, daftar]) => {
          const meta = KATEGORI_META[kategori] ?? KATEGORI_META.utilitas;
          return (
            <section key={kategori}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
                <meta.Ikon size={15} /> {meta.label}
              </h2>
              <motion.div layout className="space-y-3">
                {daftar.map((l) => {
                  const wa = l.bisaWa ? nomorWa(l.telepon) : null;
                  return (
                    <Card
                      key={l.id}
                      className="flex flex-wrap items-center gap-3 rounded-[18px] border-ap-hairline bg-white p-4 text-ap-ink shadow-none dark:border-line dark:bg-panel dark:text-ink"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold tracking-[-0.224px]">{l.nama}</h3>
                        <p className="mt-0.5 text-xs text-muted">
                          {l.telepon}
                          {l.jam ? ` · ${l.jam}` : ""}
                          {l.alamat ? ` · ${l.alamat}` : ""}
                        </p>
                      </div>
                      <a
                        href={`tel:${l.telepon.replace(/[^+\d]/g, "")}`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full bg-daun-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-daun-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
                      >
                        <Phone size={14} /> Telepon
                      </a>
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full border garis-halus px-4 py-2 text-sm font-semibold transition hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus"
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                      )}
                    </Card>
                  );
                })}
              </motion.div>
            </section>
          );
        })}
        {grup.length === 0 && (
          <KacaKartu className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
              <Search size={26} strokeWidth={1.8} />
            </span>
            <h2 className="font-display text-lg font-bold">
              {kueri.trim()
                ? "Tidak ada layanan yang cocok"
                : "Belum ada layanan terdaftar"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              {kueri.trim()
                ? "Coba kata kunci lain seperti damkar, PLN, atau sampah. Kamu juga bisa menghapus pencarian untuk melihat semua layanan."
                : "Kamu bisa memberi tahu pengurus kontak penting di lingkunganmu agar didaftarkan di sini."}
            </p>
            {kueri.trim() && (
              <Button
                variant="sekunder"
                onClick={() => setKueri("")}
                className="mt-5 min-h-[44px] focus-visible:outline-ap-blue-focus"
              >
                Hapus pencarian
              </Button>
            )}
          </KacaKartu>
        )}
      </div>
    </div>
  );
}
