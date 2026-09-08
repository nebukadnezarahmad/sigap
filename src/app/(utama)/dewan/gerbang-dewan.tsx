"use client";

import Link from "next/link";
import { Crown, ArrowLeft, UserRound } from "lucide-react";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { PitaGradient } from "@/components/eksperimen/pita-gradient";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

/* Bahasa eksperimen: header pita gelap + teks putih, konten putih dominan
   light / hitam netral dark; KacaKartu 18px tanpa shadow; link pill 44px
   Action Blue + :focus-visible; tabular untuk email demo; Fraunces tetap.
   Kunci kunyit identitas gerbang + teks, rute, dan logika TETAP. Copy civic
   kamu, tanpa emoji. R-31: putih frosted light, tile ap-tile1/2 + teks putih
   dark (tanpa hijau-lumpur). */
const LINK_PILL_APPLE =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ap-blue hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky dark:hover:bg-ap-sky/10";

export function GerbangDewan({
  alasan = "belum_login",
}: {
  alasan?: "belum_login" | "bukan_admin";
}) {
  return (
    <main>
      <PitaGradient tone="gelap">
        <header className="mx-auto max-w-lg text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Panel dewan
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-[-0.28px] text-white">
            Akses Khusus Dewan
          </h1>
          <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.374px] text-white/85 teks-pretty">
            {alasan === "bukan_admin"
              ? "Kamu masuk sebagai Warga. Dashboard ini khusus untuk peran Dewan. Gunakan tombol demo di bawah untuk beralih ke akun Dewan."
              : "Kamu belum masuk. Dashboard Dewan dipakai untuk memeriksa laporan masuk, menugaskan petugas, dan memantau kecepatan penanganan."}
          </p>
        </header>
      </PitaGradient>

      {/* Konten putih dominan light, hitam netral dark */}
      <section className="bg-white text-ap-ink dark:bg-black dark:text-white">
        <div className="mx-auto max-w-lg px-4 pb-16">
           <KacaKartu className="bg-ap-canvas p-8 text-center text-ap-ink dark:border-white/15 dark:bg-ap-tile1 dark:text-white">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-kunyit-500/15 text-kunyit-700 dark:text-kunyit-400">
              <Crown size={28} strokeWidth={1.8} />
            </div>

            <div className="rounded-[18px] border border-ap-hairline bg-ap-pearl p-4 text-left tabular-nums dark:border-white/15 dark:bg-ap-tile2">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ap-blue dark:text-ap-sky">
                <UserRound size={14} /> Masuk cepat sebagai Dewan
              </p>
              <PilihanAkunDemo tujuan="/dewan" hanyaAdmin />
            </div>

            <div className="mt-6 flex flex-col items-center gap-2 text-sm">
               <Link
                 href="/masuk?next=/dewan"
                 aria-label="Masuk untuk melanjutkan ke Dashboard Dewan"
                 className={LINK_PILL_APPLE}
               >
                 Masuk ke Dashboard Dewan
              </Link>
              <Link href="/demo" className={LINK_PILL_APPLE}>
                Lihat panduan demo
              </Link>
              <Link href="/peta" className={LINK_PILL_APPLE}>
                <ArrowLeft size={14} /> Kembali ke Peta Publik
              </Link>
            </div>
          </KacaKartu>
        </div>
      </section>
    </main>
  );
}
