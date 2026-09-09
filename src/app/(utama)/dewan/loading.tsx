import { Skeleton, SkeletonGrafik, SkeletonTeks } from "@/components/ui";

// Fallback dasbor dewan: judul + metrik + grafik + antrean.
export default function MemuatDewan() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <SkeletonTeks baris={2} label="Memuat dasbor dewan…" className="max-w-md" />
      <div role="status" aria-label="Memuat ringkasan…" className="mt-8">
        <div aria-hidden="true" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SkeletonGrafik label="Memuat tren laporan…" />
        <SkeletonGrafik label="Memuat per kategori…" />
      </div>
    </main>
  );
}
