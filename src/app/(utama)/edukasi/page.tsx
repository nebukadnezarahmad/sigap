import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { NODE_LAIN } from "@/lib/ikon-vektor";
import { EdukasiKlien } from "./edukasi-klien";

export const metadata: Metadata = { title: "Edukasi" };
export const dynamic = "force-dynamic";

const MATERI = [
  {
    slug: "pemilahan",
    judul: "Pemilahan dari sumber",
    ringkas:
      "Memisahkan organik, anorganik, dan residu di rumah memotong volume TPA hingga 60%.",
    poin: [
      "Sediakan 3 wadah: organik, anorganik, residu",
      "Bilas kemasan sebelum dibuang agar tidak menarik lalat",
      "Kardus dan botol punya nilai jual — kumpulkan terpisah",
    ],
  },
  {
    slug: "komposting",
    judul: "Komposting rumahan",
    ringkas:
      "Sisa makanan dan daun kering bisa jadi pupuk dalam 4–6 minggu memakai ember bekas.",
    poin: [
      "Takashi: susun ember berlubang + kerajang kering",
      "Aduk tiap 3 hari, jaga lembap seperti spons peras",
      "Kompos matang berwarna gelap dan tidak berbau",
    ],
  },
  {
    slug: "tiga-r",
    judul: "Reduce, Reuse, Recycle",
    ringkas:
      "Urutannya penting: kurangi dulu, pakai ulang, baru daur ulang — bukan sebaliknya.",
    poin: [
      "Reduce: bawa tas belanja & tumbler sendiri",
      "Reuse: toples selai jadi wadah bumbu",
      "Recycle: serahkan ke bank sampah, bukan tong campuran",
    ],
  },
  {
    slug: "drainase",
    judul: "Rawat saluran air",
    ringkas:
      "Saluran tersumbat sampah adalah penyebab genangan nomor satu saat hujan deras.",
    poin: [
      "Jangan buang sampah ke saluran, sekecil apa pun",
      "Bersihkan got bersama RT tiap bulan",
      "Laporkan sumbatan lewat SIGAP sebelum musim hujan",
    ],
  },
];

const SOAL = [
  {
    tanya: "Urutan yang benar dalam mengelola sampah adalah…",
    opsi: [
      "Recycle → Reduce → Reuse",
      "Reduce → Reuse → Recycle",
      "Reuse → Recycle → Reduce",
    ],
    benar: 1,
  },
  {
    tanya: "Sisa sayuran dan daun kering sebaiknya dimasukkan ke…",
    opsi: ["Residu ke TPA", "Komposter rumahan", "Dibakar di halaman"],
    benar: 1,
  },
  {
    tanya: "Kemasan plastik yang sudah dibilas bersih nilainya…",
    opsi: [
      "Tetap residu",
      "Lebih mudah didaur ulang dan bernilai jual",
      "Harus dibakar",
    ],
    benar: 1,
  },
  {
    tanya: "Penyebab utama genangan saat hujan deras adalah…",
    opsi: [
      "Saluran air tersumbat sampah",
      "Terlalu banyak awan",
      "Pohon di tepi jalan",
    ],
    benar: 0,
  },
  {
    tanya: "Manfaat bank sampah bagi warga adalah…",
    opsi: [
      "Tempat membuang sembarangan yang legal",
      "Sampah ditimbang dan jadi tabungan",
      "Pengganti TPA kota",
    ],
    benar: 1,
  },
];

export default async function HalamanEdukasi() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Database belum tersambung</h1>
      </main>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lulusSebelumnya = false;
  let kgTahun: number | null = null;
  if (user) {
    const [{ data: q }, { data: k }] = await Promise.all([
      supabase
        .from("quiz_results")
        .select("benar")
        .eq("user_id", user.id)
        .gte("benar", 4)
        .limit(1),
      supabase
        .from("kalkulator_hasil")
        .select("kg_tahun")
        .eq("user_id", user.id)
        .single(),
    ]);
    lulusSebelumnya = (q ?? []).length > 0;
    kgTahun = k?.kg_tahun ?? null;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-daun-600 dark:text-daun-400">
          Sekolah lingkungan
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
          Edukasi Permukiman
        </h1>
        <p className="mt-3 max-w-xl text-muted teks-pretty">
          Materi ringkas untuk memulai perubahan dari rumah — lengkap dengan quiz
          dan kalkulator jejak sampah pribadi.
        </p>
      </header>

      <section aria-label="Materi" className="mb-12 grid gap-4 sm:grid-cols-2">
        {MATERI.map((m, i) => (
          <Card key={m.slug} className="flex flex-col p-6">
            <span
              aria-hidden
              className="font-display text-4xl font-extrabold text-daun-600/15 dark:text-daun-300/15"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-2 font-display text-lg font-bold">{m.judul}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted teks-pretty">
              {m.ringkas}
            </p>
            <ul className="mt-3 space-y-1.5 border-t garis-halus pt-3">
              {m.poin.map((pt) => (
                <li key={pt} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-daun-500" />
                  {pt}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>

      <EdukasiKlien
        soal={SOAL}
        masuk={!!user}
        lulusSebelumnya={lulusSebelumnya}
        kgTahunAwal={kgTahun}
        ikonHadiah={NODE_LAIN.cerdas_lingkungan ?? NODE_LAIN.semai}
      />
    </main>
  );
}
