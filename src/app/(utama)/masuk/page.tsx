"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MapPin, ShieldAlert, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isTujuanAman } from "@/lib/utils";
import { Input, Label } from "@/components/ui";
import { KacaKartu } from "@/components/eksperimen/kaca";
import { PilihanAkunDemo } from "@/components/tombol-demo-login";

/* Bahasa eksperimen: tile terang parchment, KacaKartu 18px, ikon ap-blue,
   pill 44px Action Blue + :focus-visible, tabular untuk email.
   Rute, logika, dan auth TETAP. Fraunces tetap. */

const INPUT_APPLE =
  "min-h-[44px] tabular-nums focus:border-ap-blue focus:ring-ap-blue/15 focus-visible:outline-ap-blue-focus";
const LINK_PILL_APPLE =
  "inline-flex min-h-[44px] items-center justify-center rounded-full px-4 font-semibold text-ap-blue hover:bg-ap-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:text-ap-sky dark:hover:bg-ap-sky/10";

function FormulirMasuk() {
  const router = useRouter();
  const params = useSearchParams();
  const tujuanMentah = params.get("next") ?? "/peta";
  const tujuan = isTujuanAman(tujuanMentah) ? tujuanMentah : "/peta";
  const butuhAdmin = tujuan.startsWith("/dewan");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [pesan, setPesan] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: sandi,
    });
    if (error) {
      setPesan("Email atau kata sandi salah.");
      setProses(false);
      return;
    }
    router.push(tujuan);
    router.refresh();
  }

  async function masukGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(tujuan)}` },
    });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      {butuhAdmin && (
        <div className="rounded-[18px] border border-kunyit-500/30 bg-white p-4 dark:border-line dark:bg-panel">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="mt-0.5 shrink-0 text-kunyit-700 dark:text-kunyit-400" />
            <div>
              <p className="text-sm font-bold text-ap-ink dark:text-ink">
                Khusus Dashboard Dewan
              </p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Halaman yang kamu tuju khusus untuk peran Dewan. Gunakan tombol
                Dewan di bawah untuk masuk cepat.
              </p>
            </div>
          </div>
        </div>
      )}

      <KacaKartu className="bg-white/60 p-7 text-ap-ink dark:bg-white/10 dark:text-ink">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
            <MapPin size={22} strokeWidth={2} />
          </span>
          <h1 className="font-display text-2xl font-bold">Selamat datang kembali</h1>
          <p className="mt-1 text-sm text-muted">
            Masuk untuk mengirim laporan dan mendukung laporan warga lain.
          </p>
        </div>

        <div className="mb-6 rounded-[18px] border border-ap-hairline bg-ap-pearl p-4 dark:border-line dark:bg-panel-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ap-blue dark:text-ap-sky">
              <UserRound size={14} /> Coba dulu dengan akun demo
            </p>
            <Link href="/demo" className={`${LINK_PILL_APPLE} min-w-[44px] px-3 py-1 text-[11px]`}>
              Lihat panduan
            </Link>
          </div>
          <PilihanAkunDemo tujuan={tujuan} ringkas />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
          <span className="h-px flex-1 bg-ap-hairline dark:bg-line" /> atau masuk manual{" "}
          <span className="h-px flex-1 bg-ap-hairline dark:bg-line" />
        </div>

        <form onSubmit={masuk} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className={INPUT_APPLE}
            />
          </div>
          <div>
            <Label htmlFor="sandi">Kata sandi</Label>
            <Input
              id="sandi"
              type="password"
              required
              autoComplete="current-password"
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              placeholder="••••••••"
              className={INPUT_APPLE}
            />
          </div>
          {pesan && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {pesan}
            </p>
          )}
          <button
            type="submit"
            disabled={proses}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-ap-blue px-7 py-3 text-base font-semibold text-white transition hover:bg-ap-blue-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            {proses ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
          <span className="h-px flex-1 bg-ap-hairline dark:bg-line" /> atau{" "}
          <span className="h-px flex-1 bg-ap-hairline dark:bg-line" />
        </div>

        <button
          type="button"
          onClick={masukGoogle}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-ap-hairline bg-white px-5 py-2.5 text-sm font-semibold text-ap-ink transition hover:border-ap-blue hover:text-ap-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus dark:border-line dark:bg-panel dark:text-ink dark:hover:border-ap-sky dark:hover:text-ap-sky"
        >
          Lanjut dengan Google
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          Belum punya akun?{" "}
          <Link href="/daftar" className={LINK_PILL_APPLE}>
            Daftar sekarang
          </Link>
        </p>
      </KacaKartu>
    </div>
  );
}

export default function HalamanMasuk() {
  return (
    <main className="bg-ap-parchment px-4 py-14 text-ap-ink dark:bg-paper dark:text-ink">
      <Suspense fallback={null}>
        <FormulirMasuk />
      </Suspense>
    </main>
  );
}
