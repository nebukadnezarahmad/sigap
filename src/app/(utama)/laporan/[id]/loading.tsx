import { Skeleton, SkeletonKartu, SkeletonTeks } from "@/components/ui";

// Fallback detail laporan: judul + galeri + isi + panel samping.
export default function MemuatLaporan() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <SkeletonTeks baris={2} label="Memuat laporan…" className="max-w-lg" />
          <div role="status" aria-label="Memuat foto laporan…">
            <div aria-hidden="true">
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
          <SkeletonKartu label="Memuat isi laporan…" />
          <SkeletonKartu label="Memuat diskusi…" />
        </div>
        <div aria-hidden="true" className="space-y-5">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
