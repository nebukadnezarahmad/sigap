import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AksiKlien, GalatAksi } from "./aksi-klien";

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
    return <GalatAksi />;
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
    <main>
      {/* Tile header terang (canvas putih) */}
      <section className="bg-white text-ap-ink dark:bg-panel dark:text-ink">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ap-blue dark:text-ap-sky">
            Gerakan bersama
          </p>
          <h1 className="mt-3 font-serif text-[40px] font-semibold leading-[1.1] tracking-[-0.28px]">
            Aksi Bersama
          </h1>
          <p className="mt-3 max-w-xl text-[17px] leading-[1.47] tracking-[-0.374px] text-muted teks-pretty">
            Dari laporan menjadi aksi nyata. Ikut satu aksi = +5 poin; ikut dua
            aksi membuka badge Relawan.
          </p>
        </div>
      </section>

      {/* Konten parchment */}
      <section className="bg-ap-parchment text-ap-ink dark:bg-paper dark:text-ink">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <AksiKlien awal={daftar} masuk={!!user} />
        </div>
      </section>
    </main>
  );
}
