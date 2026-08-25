import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PollingKlien } from "./polling-klien";

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
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Database belum tersambung</h1>
      </main>
    );
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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Suara warga
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          Polling Partisipatif
        </h1>
        <p className="mt-3 max-w-xl text-muted teks-pretty">
          Pendapatmu menentukan arah kebijakan lingkungan. Satu warga, satu
          suara per polling — hasilnya terbuka dan berjalan realtime.
        </p>
      </header>

      <PollingKlien
        awal={polls}
        isAdmin={profil?.role === "admin"}
        masuk={!!user}
      />
    </main>
  );
}
