import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { NODE_LAIN } from "@/lib/ikon-vektor";
import { EdukasiKlien, GalatEdukasi } from "./edukasi-klien";

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
    return <GalatEdukasi />;
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
    <main>
      {/* Tile header terang (canvas putih) */}
      <section className="bg-white text-ap-ink dark:bg-panel dark:text-ink">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ap-blue dark:text-ap-sky">
            Sekolah lingkungan
          </p>
          <h1 className="mt-3 font-serif text-[40px] font-semibold leading-[1.1] tracking-[-0.28px]">
            Edukasi Permukiman
          </h1>
          <p className="mt-3 max-w-xl text-[17px] leading-[1.47] tracking-[-0.374px] text-muted teks-pretty">
            Materi ringkas untuk memulai perubahan dari rumah — lengkap dengan quiz
            dan kalkulator jejak sampah pribadi.
          </p>
        </div>
      </section>

      {/* Konten parchment */}
      <section className="bg-ap-parchment text-ap-ink dark:bg-paper dark:text-ink">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <section aria-label="Materi" className="mb-12 grid gap-4 sm:grid-cols-2">
            {MATERI.map((m, i) => (
              <div
                key={m.slug}
                className="flex flex-col rounded-[18px] border border-ap-hairline bg-white p-6 shadow-none dark:border-line dark:bg-panel dark:text-ink"
              >
                <span
                  aria-hidden
                  className="font-display text-4xl font-extrabold text-ap-blue/15 dark:text-ap-sky/20"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-2 font-display text-lg font-bold">{m.judul}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted teks-pretty">
                  {m.ringkas}
                </p>
                <ul className="mt-3 space-y-1.5 border-t border-ap-hairline pt-3 dark:border-line">
                  {m.poin.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ap-blue" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <EdukasiKlien
            soal={SOAL}
            masuk={!!user}
            lulusSebelumnya={lulusSebelumnya}
            kgTahunAwal={kgTahun}
            ikonHadiah={NODE_LAIN.cerdas_lingkungan ?? NODE_LAIN.semai}
          />
        </div>
      </section>
    </main>
  );
}
