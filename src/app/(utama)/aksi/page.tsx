import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AksiKlien } from "./aksi-klien";
import {
  GalatMuatUlang,
  KontenUtama,
  PageHeader,
} from "@/components/layout-konten";

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
      <KontenUtama>
        <GalatMuatUlang judul="Aksi Bersama belum bisa dimuat" />
      </KontenUtama>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: eventsRaw, error: galatAksi } = await supabase
    .from("events")
    .select(
      `*, profiles!events_user_id_fkey(username, nama_lengkap),
       event_rsvp(user_id)`
    )
    .gte("tanggal", batasLewat())
    .order("tanggal", { ascending: true })
    .limit(30);

  if (galatAksi) {
    return (
      <KontenUtama>
        <GalatMuatUlang judul="Aksi Bersama belum bisa dimuat" />
      </KontenUtama>
    );
  }

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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        eyebrow="Gerakan bersama"
        judul="Aksi Bersama"
        deskripsi="Dari laporan menjadi aksi nyata. Ikut satu aksi = +5 poin; ikut dua aksi membuka lencana Relawan."
      />

      <AksiKlien awal={daftar} masuk={!!user} />
    </main>
  );
}
