import { SkeletonKartu, SkeletonTeks } from "@/components/ui";

// Fallback rute generik (utama): judul + daftar kartu.
export default function Memuat() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <SkeletonTeks baris={2} label="Memuat halaman…" className="max-w-md" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <SkeletonKartu label="Memuat konten…" />
        <SkeletonKartu label="Memuat konten…" />
        <SkeletonKartu label="Memuat konten…" />
        <SkeletonKartu label="Memuat konten…" />
      </div>
    </main>
  );
}
