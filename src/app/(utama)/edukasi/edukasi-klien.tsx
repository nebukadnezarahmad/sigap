"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Award, Calculator, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Label } from "@/components/ui";
import { IkonVektor, type NodeIkon } from "@/lib/ikon-vektor";

type Soal = { tanya: string; opsi: string[]; benar: number };

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
  const router = useRouter();
  const [mulai, setMulai] = useState(false);
  const [indeks, setIndeks] = useState(0);
  const [pilih, setPilih] = useState<number | null>(null);
  const [benar, setBenar] = useState(0);
  const [selesaiQuiz, setSelesaiQuiz] = useState(false);
  const [tersimpan, setTersimpan] = useState(false);

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
      await supabase.from("quiz_results").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        benar: benarBaru,
        total: soal.length,
      });
      setTersimpan(true);
      selesai();
    }
  }

  function ulang() {
    setMulai(false);
    setIndeks(0);
    setPilih(null);
    setBenar(0);
    setSelesaiQuiz(false);
    setTersimpan(false);
  }

  return (
    <section aria-label="Quiz edukasi">
      <Card className="overflow-hidden p-0">
        <div className="border-b garis-halus bg-panel-2/60 px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Award size={19} className="text-kunyit-500" /> Quiz: Seberapa Hijau
            Kamu?
          </h2>
          <p className="mt-1 text-sm text-muted">
            {soal.length} soal · lulus {soal.length - 1}/{soal.length} untuk
            badge & +15 poin
          </p>
        </div>

        <div className="p-6">
          {!masuk && (
            <div className="text-center">
              <p className="text-sm text-muted">
                Masuk dulu untuk mengikuti quiz — skor lulus memberimu badge
                Cerdas Lingkungan.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/masuk?next=/edukasi")}
              >
                Masuk sekarang
              </Button>
            </div>
          )}

          {masuk && !mulai && !selesaiQuiz && (
            <div className="text-center">
              <p className="text-sm text-muted">
                {lulusSebelumnya
                  ? "Kamu sudah pernah lulus. Uji lagi dan pertahankan gelarmu."
                  : "Jawab 5 pertanyaan singkat tentang pengelolaan sampah."}
              </p>
              <Button className="mt-4" size="lg" onClick={() => setMulai(true)}>
                Mulai quiz
              </Button>
            </div>
          )}

          {masuk && mulai && !selesaiQuiz && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                {soal.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i < indeks
                        ? "w-8 bg-daun-500"
                        : i === indeks
                          ? "w-8 bg-daun-600"
                          : "w-4 bg-line"
                    }`}
                  />
                ))}
                <span className="angka-tabular ml-auto text-xs font-semibold text-muted">
                  {indeks + 1}/{soal.length}
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
                      key={i}
                      onClick={() => setPilih(i)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                        dipilihKu
                          ? "border-daun-500 bg-daun-500/10"
                          : "garis-halus hover:border-daun-400"
                      }`}
                    >
                      {o}
                      {dipilihKu && (
                        <CheckCircle2 size={16} className="shrink-0 text-daun-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              <Button
                className="mt-5 w-full"
                size="lg"
                disabled={!skor}
                onClick={lanjut}
              >
                {indeks < soal.length - 1 ? "Lanjut" : "Lihat hasil"}
              </Button>
            </div>
          )}

          {masuk && selesaiQuiz && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="angka-tabular font-display text-5xl font-extrabold text-daun-700 dark:text-daun-300">
                {benar}
                <span className="text-2xl text-muted">/{soal.length}</span>
              </p>
              {benar >= soal.length - 1 ? (
                <p className="mt-3 flex items-center justify-center gap-2 font-display text-lg font-bold">
                  <IkonVektor node={ikonHadiah} ukuran={20} /> Lulus — badge
                  Cerdas Lingkungan
                </p>
              ) : (
                <p className="mt-3 flex items-center justify-center gap-2 font-display text-lg font-bold text-muted">
                  <XCircle size={19} /> Belum lulus — baca materi lagi lalu coba
                  ulang.
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                {tersimpan
                  ? benar >= soal.length - 1 && !lulusSebelumnya
                    ? "+15 poin masuk ke akunmu."
                    : "Skor tersimpan."
                  : "Masuk untuk menyimpan skor."}
              </p>
              <Button variant="sekunder" className="mt-5" onClick={ulang}>
                Coba lagi
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
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

  const lengkap = PERTANYAAN_KALKULATOR.every((q) => jawaban[q.kunci] != null);

  async function hitung() {
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
      await supabase.from("kalkulator_hasil").upsert({
        user_id: user.id,
        kg_tahun: kg,
        updated_at: new Date().toISOString(),
      });
      router.refresh();
    }
    setProses(false);
  }

  const rataRata = 255;

  return (
    <section aria-label="Kalkulator jejak sampah">
      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Calculator size={19} className="text-kunyit-500" /> Kalkulator Jejak
          Sampah Pribadi
        </h2>
        <p className="mt-1 text-sm text-muted">
          Estimasi timbulan sampah rumahmu per tahun dibanding rata-rata nasional
          ({rataRata} kg/orang/tahun).
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PERTANYAAN_KALKULATOR.map((q) => (
            <div key={q.kunci}>
              <Label>{q.tanya}</Label>
              <div className="flex flex-wrap gap-1.5">
                {q.opsi.map((o, i) => (
                  <button
                    key={o}
                    onClick={() =>
                      setJawaban((j) => ({ ...j, [q.kunci]: i }))
                    }
                    aria-pressed={jawaban[q.kunci] === i}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      jawaban[q.kunci] === i
                        ? "border-transparent bg-daun-600 text-white"
                        : "garis-halus text-muted hover:text-ink"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button
          className="mt-5"
          size="lg"
          disabled={!lengkap || proses}
          onClick={hitung}
        >
          {proses ? "Menyimpan…" : hasil !== null ? "Hitung ulang" : "Hitung jejakku"}
        </Button>

        {hasil !== null && (
          <motion.div
            key={hasil}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border garis-halus bg-panel-2/60 p-5 text-center"
          >
            <p className="angka-tabular font-serif text-4xl font-semibold text-daun-700 dark:text-daun-300">
              {hasil.toLocaleString("id-ID")} kg
            </p>
            <p className="mt-1 text-sm text-muted">per tahun untuk rumahmu</p>
            <div className="mx-auto mt-4 max-w-sm">
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
              <p className="mt-2 text-xs text-muted">
                {hasil <= rataRata
                  ? "Di bawah rata-rata nasional — pertahankan!"
                  : `Di atas rata-rata nasional (${rataRata} kg) — mulai dari memilah & mengurangi plastik.`}
              </p>
            </div>
            {masuk && (
              <p className="mt-3 text-xs text-muted">
                Hasil tersimpan di profilmu · +5 poin untuk perhitungan pertama.
              </p>
            )}
          </motion.div>
        )}
      </Card>
    </section>
  );
}
