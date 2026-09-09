import Link from "next/link";

export default function TidakDitemukan() {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-display text-[88px] font-extrabold leading-none text-action/15">
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
        <Link
          href="/peta"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-action px-5 text-sm font-semibold text-white transition hover:bg-action-hover"
        >
          Buka peta
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border garis-halus px-5 text-sm font-semibold transition hover:border-action hover:text-action"
        >
          Halaman utama
        </Link>
      </div>
    </main>
  );
}
