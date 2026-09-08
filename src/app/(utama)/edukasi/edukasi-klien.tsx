"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Award, Calculator, CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Skeleton } from "@/components/ui";
import { KacaKartu, KacaPill } from "@/components/eksperimen/kaca";
import { IkonVektor, type NodeIkon } from "@/lib/ikon-vektor";
import { formatAngka } from "@/lib/utils";

type Soal = { tanya: string; opsi: string[]; benar: number };

/* Grammar Apple (FUSI): kartu utilitas putih hairline radius 18;
   sorotan memakai KacaKartu; fokus Action Blue; target sentuh 44px. */
const KARTU_UTILITAS =
  "rounded-[18px] border border-ap-hairline bg-white shadow-none dark:border-line dark:bg-panel dark:text-ink";
const FOKUS_APPLE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus!";
const TOMBOL_UTAMA_APPLE =
  "min-h-[44px] bg-ap-blue text-white shadow-none hover:bg-ap-blue-focus focus-visible:outline-ap-blue-focus!";

export function GalatEdukasi() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className={`${KARTU_UTILITAS} p-8`}>
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-danger/10 text-danger">
          <TriangleAlert size={26} strokeWidth={1.8} aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-bold">
          Edukasi belum bisa dimuat
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Kamu tidak ketinggalan materi apa pun. Quiz dan kalkulator gagal
          dimuat karena koneksi terputus.
        </p>
        <ol className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-muted">
          <li>1. Periksa koneksi internet kamu.</li>
          <li>2. Pilih Coba lagi di bawah.</li>
          <li>3. Kalau masih gagal, kembali lagi beberapa menit lagi.</li>
        </ol>
        <Button className={`mt-6 ${TOMBOL_UTAMA_APPLE}`} onClick={() => router.refresh()}>
          Coba lagi
        </Button>
      </div>
    </main>
  );
}

/* Skeleton muat edukasi: tanpa ilustrasi karena ini muat. */
export function MuatEdukasi() {
  return (
    <div aria-busy="true" className="space-y-12">
      <p role="status" className="sr-only">
        Memuat materi edukasi
      </p>
      <div className={`${KARTU_UTILITAS} p-6`}>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        <Skeleton className="mt-4 h-11 w-full rounded-full" />
      </div>
      <div className={`${KARTU_UTILITAS} p-6`}>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-2 h-4 w-full" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[18px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EdukasiKlien({
  soal,
  masuk,
  lulusSebelumnya,
  kgTahunAwal,
  ikonHadiah,
}: {
  soal: Soal[];
  masuk: boolean;
  lulusSebelumnya: boolean;
  kgTahunAwal: number | null;
  ikonHadiah: NodeIkon;
}) {
  const router = useRouter();

  return (
    <div className="space-y-12">
      <QuizSection
        soal={soal}
        masuk={masuk}
        lulusSebelumnya={lulusSebelumnya}
        ikonHadiah={ikonHadiah}
        selesai={() => router.refresh()}
      />
      <KalkulatorSection masuk={masuk} awal={kgTahunAwal} />
    </div>
  );
}

function QuizSection({
  soal,
  masuk,
  lulusSebelumnya,
  ikonHadiah,
  selesai,
}: {
  soal: Soal[];
  masuk: boolean;
  lulusSebelumnya: boolean;
  ikonHadiah: NodeIkon;
  selesai: () => void;
}) {
  const [mulai, setMulai] = useState(false);
  const [indeks, setIndeks] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [benar, setBenar] = useState(0);
  const [selesaiQuiz, setSelesaiQuiz] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);
  const [pesanSimpan, setPesanSimpan] = useState<string | null>(null);

  const skor = soal[indeks] && pilih !== null;

  async function lanjut() {
    const tepat = pilih === soal[indeks].benar;
    const benarBaru = benar + (tepat ? 1 : 0);
    setBenar(benarBaru);

    if (indeks < soal.length - 1) {
      setIndeks((i) => i + 1);
      setPilih(null);
      return;
    }

    setSelesaiQuiz(true);
    if (masuk) {
      const supabase = createClient();
      const { error } = await supabase.from("quiz_results").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        benar: benarBaru,
        total: soal.length,
      });
      if (error) {
        setPesanSimpan("Skor belum tersimpan. Coba lagi nanti.");
      } else {
        setTersimpan(true);
        selesai();
      }
    }
  }

  function ulang() {
    setMulai(false);
    setIndeks(0);
    setPilih(null);
    setBenar(0);
    setSelesaiQuiz(false);
    setTersimpan(false);
    setPesanSimpan(null);
  }

  if (soal.length === 0) {
    return (
      <section aria-label="Quiz edukasi">
        <div className={`${KARTU_UTILITAS} overflow-hidden p-0`}>
          <div className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
              <Award size={26} strokeWidth={1.8} aria-hidden />
            </span>
            <h2 className="font-display text-xl font-bold">
              Soal quiz belum tersedia
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Kamu belum ketinggalan apa pun. Soal sedang disiapkan pengurus.
              Sambil menunggu, kamu bisa mencoba kalkulator jejak sampah di
              bawah.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Quiz edukasi">
      <div className={`${KARTU_UTILITAS} overflow-hidden p-0`}>
        <div className="border-b border-ap-hairline bg-ap-parchment/80 px-6 py-4 backdrop-blur dark:border-line dark:bg-panel-2">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Award size={19} aria-hidden className="text-kunyit-500" /> Quiz: Seberapa Hijau
            Kamu?
          </h2>
          <p className="mt-1 text-sm text-muted">
            {formatAngka(soal.length)} soal · lulus {formatAngka(soal.length - 1)}/{formatAngka(soal.length)} untuk
            badge & +15 poin
          </p>
        </div>

        <div className="p-6">
          {!masuk && (
            <div className="text-center">
              <p className="text-sm text-muted">
                Masuk dulu untuk mengikuti quiz. Skor lulus memberimu badge
                Cerdas Lingkungan.
              </p>
              <Link
                href="/masuk?next=/edukasi"
                className={`mt-4 inline-flex items-center justify-center rounded-full px-5 py-2.5 font-semibold ${TOMBOL_UTAMA_APPLE}`}
              >
                Masuk sekarang
              </Link>
            </div>
          )}

          {masuk && !mulai && !selesaiQuiz && (
            <div className="text-center">
              <p className="text-sm text-muted">
                {lulusSebelumnya
                  ? "Kamu sudah pernah lulus. Uji lagi dan pertahankan gelarmu."
                  : "Jawab 5 pertanyaan singkat tentang pengelolaan sampah."}
              </p>
              <Button className={`mt-4 ${TOMBOL_UTAMA_APPLE}`} size="lg" onClick={() => setMulai(true)}>
                Mulai quiz
              </Button>
            </div>
          )}

          {masuk && mulai && !selesaiQuiz && (
            <div>
              <div className="mb-4 flex items-center gap-2 rounded-full border border-ap-hairline bg-ap-parchment/80 px-3 py-2 backdrop-blur dark:border-line dark:bg-panel-2">
                {soal.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-[width,background-color] ${
                      i < indeks
                        ? "w-8 bg-ap-blue"
                        : i === indeks
                          ? "w-8 bg-ap-blue-focus"
                          : "w-4 bg-line"
                    }`}
                  />
                ))}
                <span className="angka-tabular ml-auto text-xs font-semibold text-muted">
                  {formatAngka(indeks + 1)}/{formatAngka(soal.length)}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold leading-snug">
                {soal[indeks].tanya}
              </h3>
              <div className="mt-4 space-y-2">
                {soal[indeks].opsi.map((o, i) => {
                  const dipilihKu = pilih === i;
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setPilih(i)}
                      className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-full border px-4 py-3 text-left text-sm font-medium transition ${FOKUS_APPLE} ${
                        dipilihKu
                          ? "border-ap-blue bg-ap-blue/5"
                          : "border-ap-hairline bg-white hover:border-ap-blue dark:border-line dark:bg-panel"
                      }`}
                    >
                      {o}
                      {dipilihKu && (
                        <CheckCircle2 size={16} aria-hidden className="shrink-0 text-ap-blue" />
                      )}
                    </button>
                  );
                })}
              </div>
              <Button
                className={`mt-5 w-full ${TOMBOL_UTAMA_APPLE}`}
                size="lg"
                disabled={!skor}
                onClick={lanjut}
              >
                {indeks < soal.length - 1
                  ? `Lanjut ke soal ${formatAngka(indeks + 2)}`
                  : "Lihat hasil"}
              </Button>
            </div>
          )}

          {masuk && selesaiQuiz && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <KacaKartu className="p-6 text-center">
                <p className="angka-tabular font-display text-5xl font-extrabold text-ap-ink dark:text-ink">
                  {formatAngka(benar)}
                  <span className="text-2xl text-muted">/{formatAngka(soal.length)}</span>
                </p>
                {benar >= soal.length - 1 ? (
                  <p className="mt-3 flex items-center justify-center gap-2 font-display text-lg font-bold">
                    <IkonVektor node={ikonHadiah} ukuran={20} /> Lulus: badge
                    Cerdas Lingkungan
                  </p>
                ) : (
                  <p className="mt-3 flex items-center justify-center gap-2 font-display text-lg font-bold text-muted">
                    <XCircle size={19} /> Belum lulus. Baca materi lagi lalu coba
                    ulang.
                  </p>
                )}
                <p
                  role={pesanSimpan ? "alert" : "status"}
                  aria-live={pesanSimpan ? "assertive" : "polite"}
                  className="mt-2 text-sm text-muted"
                >
                  {pesanSimpan ??
                    (tersimpan
                      ? benar >= soal.length - 1 && !lulusSebelumnya
                        ? "+15 poin masuk ke akunmu."
                        : "Skor tersimpan."
                      : "Masuk untuk menyimpan skor.")}
                </p>
                <KacaPill
                  type="button"
                  onClick={ulang}
                  className={`mt-5 min-h-[44px] ${FOKUS_APPLE}`}
                >
                  Ulangi quiz
                </KacaPill>
              </KacaKartu>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

const PERTANYAAN_KALKULATOR = [
  {
    kunci: "orang",
    tanya: "Jumlah penghuni rumah",
    opsi: ["1 orang", "2–3 orang", "4–5 orang", "Lebih dari 5 orang"],
    bobot: [0.5, 1.4, 2.6, 3.4],
  },
  {
    kunci: "plastik",
    tanya: "Kebiasaan belanja menggunakan kantong plastik",
    opsi: ["Hampir tidak pernah", "Kadang", "Sering", "Selalu"],
    bobot: [8, 22, 40, 60],
  },
  {
    kunci: "pilah",
    tanya: "Memilah sampah rumah tangga",
    opsi: ["Selalu", "Sering", "Jarang", "Tidak pernah"],
    bobot: [15, 40, 70, 95],
  },
  {
    kunci: "makanan",
    tanya: "Sisa makanan diolah (kompos / pakan ternak)",
    opsi: ["Selalu", "Kadang", "Tidak pernah"],
    bobot: [10, 45, 85],
  },
  {
    kunci: "online",
    tanya: "Belanja online / bungkus makanan per minggu",
    opsi: ["0–1 kali", "2–4 kali", "5–9 kali", "Lebih dari 9 kali"],
    bobot: [6, 25, 55, 90],
  },
];

function KalkulatorSection({
  masuk,
  awal,
}: {
  masuk: boolean;
  awal: number | null;
}) {
  const router = useRouter();
  const [jawaban, setJawaban] = useState<Record<string, number>>({});
  const [hasil, setHasil] = useState<number | null>(awal);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const lengkap = PERTANYAAN_KALKULATOR.every((q) => jawaban[q.kunci] != null);

  async function hitung() {
    setPesan(null);
    let total = 0;
    for (const q of PERTANYAAN_KALKULATOR) {
      total += q.bobot[jawaban[q.kunci] ?? 0];
    }
    const kg = Math.round(total * 10) / 10;
    setHasil(kg);
    if (!masuk) return;
    setProses(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("kalkulator_hasil").upsert({
        user_id: user.id,
        kg_tahun: kg,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        setPesan("Hasil belum tersimpan. Coba lagi nanti.");
      } else {
        router.refresh();
      }
    }
    setProses(false);
  }

  const rataRata = 255;

  return (
    <section aria-label="Kalkulator jejak sampah">
      <div className={`${KARTU_UTILITAS} p-6`}>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Calculator size={19} aria-hidden className="text-kunyit-500" /> Kalkulator Jejak
          Sampah Pribadi
        </h2>
        <p className="mt-1 text-sm text-muted">
          Estimasi timbulan sampah rumahmu per tahun dibanding rata-rata nasional
          ({formatAngka(rataRata)} kg/orang/tahun).
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PERTANYAAN_KALKULATOR.map((q) => (
            <fieldset key={q.kunci}>
              <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                {q.tanya}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {q.opsi.map((o, i) => (
                  <button
                    type="button"
                    key={o}
                    onClick={() =>
                      setJawaban((j) => ({ ...j, [q.kunci]: i }))
                    }
                    aria-pressed={jawaban[q.kunci] === i}
                    className={`min-h-[44px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${FOKUS_APPLE} ${
                      jawaban[q.kunci] === i
                        ? "border-transparent bg-ap-blue text-white"
                        : "border-ap-hairline text-muted hover:border-ap-blue hover:text-ap-blue dark:border-line"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <Button
          className={`mt-5 ${TOMBOL_UTAMA_APPLE}`}
          size="lg"
          disabled={!lengkap || proses}
          onClick={hitung}
        >
          {proses ? "Menyimpan" : hasil !== null ? "Hitung ulang" : "Hitung jejakku"}
        </Button>

        {hasil === null ? (
          <div className="mt-6">
            <KacaKartu className="p-6 text-center">
              <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[18px] bg-ap-blue/10 text-ap-blue dark:text-ap-sky">
                <Calculator size={26} strokeWidth={1.8} aria-hidden />
              </span>
              <h3 className="font-display text-lg font-bold">
                Kamu belum menghitung jejakmu
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Jawab lima pertanyaan singkat di atas, lalu pilih Hitung
                jejakku. Hasilnya tersimpan di profilmu kalau kamu masuk.
              </p>
            </KacaKartu>
          </div>
        ) : (
          <motion.div
            key={hasil}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <KacaKartu className="p-5 text-center">
              <p className="angka-tabular font-serif text-4xl font-semibold text-ap-ink dark:text-ink">
                {formatAngka(hasil)} kg
              </p>
              <p className="mt-1 text-sm text-muted">per tahun untuk rumahmu</p>
              {pesan && (
                <p role="alert" aria-live="assertive" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
                  {pesan}
                </p>
              )}
              <div className="mx-auto mt-4 max-w-sm">
                <div className="rounded-full border border-ap-hairline bg-white/60 p-1.5 backdrop-blur dark:border-line dark:bg-panel-2">
                  <div className="relative h-3 overflow-hidden rounded-full bg-line">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        hasil <= rataRata ? "bg-daun-500" : "bg-kunyit-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (hasil / (rataRata * 2)) * 100)}%`,
                      }}
                    />
                    <span
                      className="absolute inset-y-0 w-0.5 bg-ink"
                      style={{ left: "50%" }}
                      title="Rata-rata nasional"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {hasil <= rataRata
                    ? "Di bawah rata-rata nasional. Pertahankan!"
                    : `Di atas rata-rata nasional (${formatAngka(rataRata)} kg). Mulai dari memilah & mengurangi plastik.`}
                </p>
              </div>
              {masuk && (
                <p className="mt-3 text-xs text-muted">
                  Hasil tersimpan di profilmu. +5 poin untuk perhitungan pertama.
                </p>
              )}
            </KacaKartu>
          </motion.div>
        )}
      </div>
    </section>
  );
}
