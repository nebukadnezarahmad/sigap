import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type JenisFeedback = "kosong" | "tanpa-hasil" | "galat" | "luring";

// Status kosong/galat tanpa foto: ikon 40px muted dalam lingkaran lembut,
// judul singkat, teks rata tengah max-w-sm.
// Contoh pakai:
//   <FeedbackState jenis="kosong" ikon={Inbox} judul="Belum ada laporan"
//     deskripsi="Jadilah yang pertama melapor di lingkunganmu."
//     aksi={<Button>Lapor sekarang</Button>} />
export function FeedbackState({
  jenis,
  ikon: Ikon,
  judul,
  deskripsi,
  aksi,
  className,
}: {
  jenis: JenisFeedback;
  ikon: LucideIcon;
  judul: string;
  deskripsi?: string;
  aksi?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-jenis={jenis}
      role={jenis === "galat" ? "alert" : "status"}
      className={cn(
        "mx-auto flex w-full max-w-sm flex-col items-center px-6 py-10 text-center",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-20 items-center justify-center rounded-full bg-panel-2 text-muted"
      >
        <Ikon size={40} strokeWidth={1.5} />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{judul}</h3>
      {deskripsi && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{deskripsi}</p>
      )}
      {aksi && <div className="mt-5 flex justify-center">{aksi}</div>}
    </div>
  );
}
