import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GalatPolling, PollingKlien } from "./polling-klien";

export const metadata: Metadata = { title: "Polling Warga" };
export const dynamic = "force-dynamic";

export type Poll = {
  id: string;
  pertanyaan: string;
  opsi: string[];
  totalSuara: number;
  perOpsi: number[];
  pilihanKu: number | null;
  buatanKu: boolean;
};

export default async function HalamanPolling() {
  const supabase = await createClient();

  if (!supabase) {
    return <GalatPolling />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pollsRaw } = await supabase
    .from("polls")
    .select("id, pertanyaan, opsi, created_by, created_at")
    .eq("aktif", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const ids = (pollsRaw ?? []).map((p) => p.id);
  const { data: votesRaw } = ids.length
    ? await supabase.from("poll_votes").select("poll_id, user_id, opsi_idx").in("poll_id", ids)
    : { data: [] };

  const polls: Poll[] = (pollsRaw ?? []).map((p) => {
    const opsi = p.opsi as string[];
    const suara = (votesRaw ?? []).filter((v) => v.poll_id === p.id);
    const perOpsi = opsi.map(
      (_, i) => suara.filter((v) => v.opsi_idx === i).length
    );
    const ku = user ? suara.find((v) => v.user_id === user.id) : null;
    return {
      id: p.id,
      pertanyaan: p.pertanyaan,
      opsi,
      totalSuara: suara.length,
      perOpsi,
      pilihanKu: ku ? ku.opsi_idx : null,
      buatanKu: user ? p.created_by === user.id : false,
    };
  });

  const { data: profil } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  return (
    <main>
      {/* Tile header terang (canvas putih) */}
      <section className="bg-white text-ap-ink dark:bg-panel dark:text-ink">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ap-blue dark:text-ap-sky">
            Suara warga
          </p>
          <h1 className="mt-3 font-serif text-[40px] font-semibold leading-[1.1] tracking-[-0.28px]">
            Polling Partisipatif
          </h1>
          <p className="mt-3 max-w-xl text-[17px] leading-[1.47] tracking-[-0.374px] text-muted teks-pretty">
            Pendapatmu menentukan arah kebijakan lingkungan. Satu warga, satu
            suara per polling. Hasilnya terbuka dan berjalan realtime.
          </p>
        </div>
      </section>

      {/* Konten parchment */}
      <section className="bg-ap-parchment text-ap-ink dark:bg-paper dark:text-ink">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <PollingKlien
            awal={polls}
            isAdmin={profil?.role === "admin"}
            masuk={!!user}
          />
        </div>
      </section>
    </main>
  );
}
