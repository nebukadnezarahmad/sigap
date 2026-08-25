import Link from "next/link";
import { Button } from "@/components/ui";

export default function TidakDitemukan() {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-display text-[88px] font-extrabold leading-none text-daun-600/15 dark:text-daun-300/15">
        404
      </p>
      <h1 className="-mt-8 font-display text-3xl font-bold">
        Titik ini kosong di peta
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Halaman yang kamu cari tidak ada — mungkin laporannya sudah ditangani
        dan diarsipkan, atau tautannya salah ketik.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/peta">
          <Button>Kembali ke peta</Button>
        </Link>
        <Link href="/">
          <Button variant="sekunder">Halaman utama</Button>
        </Link>
      </div>
    </main>
  );
}
