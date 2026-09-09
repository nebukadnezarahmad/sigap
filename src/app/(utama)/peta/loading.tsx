import { Skeleton } from "@/components/ui";

// Fallback peta: kanvas peta + bilah saringan.
export default function MemuatPeta() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div role="status" aria-label="Memuat peta…">
        <div aria-hidden="true" className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <Skeleton className="h-[60dvh] w-full rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
