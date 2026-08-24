"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label } from "@/components/ui";

function FormulirMasuk() {
  const router = useRouter();
  const params = useSearchParams();
  const tujuan = params.get("next") ?? "/peta";
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
      options: { redirectTo: `${location.origin}/auth/callback?next=${tujuan}` },
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md p-7">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-daun-600 text-white">
          <MapPin size={22} strokeWidth={2.5} />
        </span>
        <h1 className="font-display text-2xl font-bold">Selamat datang kembali</h1>
        <p className="mt-1 text-sm text-muted">
          Masuk untuk melapor dan mendukung warga lain.
        </p>
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
          />
        </div>
        {pesan && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {pesan}
          </p>
        )}
        <Button type="submit" disabled={proses} className="w-full" size="lg">
          {proses ? "Memproses…" : "Masuk"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" /> atau{" "}
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button variant="sekunder" onClick={masukGoogle} className="w-full">
        Lanjut dengan Google
      </Button>

      <p className="mt-6 text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-daun-700 hover:underline dark:text-daun-300">
          Daftar sekarang
        </Link>
      </p>
    </Card>
  );
}

export default function HalamanMasuk() {
  return (
    <main className="px-4 py-14">
      <Suspense fallback={null}>
        <FormulirMasuk />
      </Suspense>
    </main>
  );
}
