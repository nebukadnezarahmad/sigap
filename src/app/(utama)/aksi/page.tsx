import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AksiKlien } from "./aksi-klien";

export const metadata: Metadata = { title: "Aksi Bersama" };
export const dynamic = "force-dynamic";

export type EventAksi = {
  id: string;
  judul: string;
  deskripsi: string;
  alamat: string | null;
  tanggal: string;
  totalRsvp: number;
  akuIkut: boolean;
  pembuatKu: boolean;
  namaPembuat: string;
};

function batasLewat() {
  return new Date(Date.now() - 86400000).toISOString();
}

export default async function HalamanAksi() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Database belum tersambung</h1>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: eventsRaw } = await supabase
    .from("events")
    .select(
      `*, profiles!events_user_id_fkey(username, nama_lengkap),
       event_rsvp(user_id)`
    )
    .gte("tanggal", batasLewat())
    .order("tanggal", { ascending: true })
    .limit(30);

  const daftar: EventAksi[] = (eventsRaw ?? []).map((e) => {
    const rsvp = e.event_rsvp ?? [];
    return {
      id: e.id,
      judul: e.judul,
      deskripsi: e.deskripsi,
      alamat: e.alamat,
      tanggal: e.tanggal,
      totalRsvp: rsvp.length,
      akuIkut: user
        ? rsvp.some((x: { user_id: string }) => x.user_id === user.id)
        : false,
      pembuatKu: user ? e.user_id === user.id : false,
      namaPembuat: e.profiles?.nama_lengkap ?? "Warga",
    };
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Gerakan bersama
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          Aksi Bersama
        </h1>
        <p className="mt-3 max-w-xl text-muted teks-pretty">
          Dari laporan menjadi aksi nyata. Ikut satu aksi = +5 poin; ikut dua
          aksi membuka badge Relawan.
        </p>
      </header>

      <AksiKlien awal={daftar} masuk={!!user} />
    </main>
  );
}
