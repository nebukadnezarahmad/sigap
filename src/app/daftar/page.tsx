"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Label } from "@/components/ui";

function FormulirDaftar() {
  const router = useRouter();
  const params = useSearchParams();
  const tujuan = params.get("next") ?? "/peta";
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [pesan, setPesan] = useState<string | null>(null);
  const [proses, setProses] = useState(false);

  async function daftar(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setPesan(
        "Username 3–20 karakter: huruf kecil, angka, dan garis bawah saja."
      );
      setProses(false);
      return;
    }

    const supabase = createClient();

    const { data: ada } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (ada) {
      setPesan("Username sudah dipakai, coba yang lain.");
      setProses(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: sandi,
      options: {
        data: { nama_lengkap: nama, username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setPesan(
        error.message === "User already registered"
          ? "Email sudah terdaftar. Coba masuk."
          : `Gagal mendaftar: ${error.message}`
      );
      setProses(false);
      return;
    }

    if (data.user && !data.session) {
      setPesan(null);
      alert(
        "Pendaftaran berhasil! Cek emailmu untuk verifikasi, lalu masuk."
      );
      router.push("/masuk");
      return;
    }

    router.push(tujuan);
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-md p-7">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-daun-600 text-white">
          <MapPin size={22} strokeWidth={2.5} />
        </span>
        <h1 className="font-display text-2xl font-bold">Gabung jadi warga SIGAP</h1>
        <p className="mt-1 text-sm text-muted">
          Gratis — mulai laporkan dan dapatkan poin partisipasi.
        </p>
      </div>

      <form onSubmit={daftar} className="space-y-4">
        <div>
          <Label htmlFor="nama">Nama lengkap</Label>
          <Input id="nama" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Budi Santoso" />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="budi_s" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
        </div>
        <div>
          <Label htmlFor="sandi">Kata sandi</Label>
          <Input id="sandi" type="password" required minLength={8} autoComplete="new-password" value={sandi} onChange={(e) => setSandi(e.target.value)} placeholder="Minimal 8 karakter" />
        </div>
        {pesan && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {pesan}
          </p>
        )}
        <Button type="submit" disabled={proses} className="w-full" size="lg">
          {proses ? "Memproses…" : "Buat akun"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-daun-700 hover:underline dark:text-daun-300">
          Masuk
        </Link>
      </p>
    </Card>
  );
}

export default function HalamanDaftar() {
  return (
    <main className="px-4 py-14">
      <Suspense fallback={null}>
        <FormulirDaftar />
      </Suspense>
    </main>
  );
}
