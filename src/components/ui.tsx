import { useId } from "react";
import { cn, inisial } from "@/lib/utils";
import { STATUS, type StatusKey } from "@/lib/constants";

/* ---------------------------------------------------------------------------
   Aturan permukaan
   Satu lapis boleh punya bayangan ATAU garis, tidak keduanya. Di mode gelap
   bayangan praktis tak terlihat, jadi garis yang memikul definisi. Kalau
   sebuah permukaan berada di dalam permukaan lain, yang di dalam memakai
   varian "datar" atau "garis" — bukan kartu bertumpuk.
   --------------------------------------------------------------------------- */

type VarianPermukaan = "kartu" | "datar" | "garis" | "melayang";

const PERMUKAAN: Record<VarianPermukaan, string> = {
  kartu:
    "rounded-kartu bg-panel shadow-kartu dark:shadow-none dark:border dark:garis-halus",
  datar: "rounded-kartu bg-panel-2",
  garis: "rounded-kartu border garis-halus bg-transparent",
  melayang:
    "rounded-panel bg-panel shadow-melayang dark:border dark:garis-halus",
};

export function Card({
  variant = "kartu",
  interaktif = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: VarianPermukaan;
  interaktif?: boolean;
}) {
  return (
    <div
      className={cn(
        PERMUKAAN[variant],
        interaktif &&
          "transition-[transform,box-shadow,border-color] duration-300 ease-sigap hover:-translate-y-0.5 hover:shadow-melayang dark:hover:border-line-kuat",
        className
      )}
      {...props}
    />
  );
}

export function Button({
  variant = "utama",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "utama" | "sekunder" | "hantu" | "bahaya" | "darurat";
  size?: "xs" | "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-kontrol font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-300 ease-sigap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fokus disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
        size === "xs" && "px-3 py-1.5 text-xs",
        size === "sm" && "px-3.5 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3 text-base",
        variant === "utama" &&
          "bg-daun-600 text-white shadow-[0_1px_2px_rgb(23_67_42/0.2),0_6px_16px_-6px_rgb(23_67_42/0.35)] hover:bg-daun-700 hover:shadow-[0_2px_4px_rgb(23_67_42/0.2),0_10px_24px_-6px_rgb(23_67_42/0.4)]",
        variant === "sekunder" &&
          "border garis-halus bg-panel text-ink hover:border-daun-400 hover:text-daun-700 dark:hover:text-daun-300",
        variant === "hantu" && "text-muted hover:bg-panel-2 hover:text-ink",
        variant === "bahaya" &&
          "bg-danger/10 text-danger-kuat hover:bg-danger hover:text-white dark:text-red-300",
        variant === "darurat" &&
          "bg-danger text-white shadow-[0_1px_2px_rgb(127_29_29/0.25),0_6px_16px_-6px_rgb(127_29_29/0.45)] hover:bg-danger-kuat",
        className
      )}
      {...props}
    />
  );
}

const GAYA_ISIAN =
  "w-full rounded-item border garis-halus bg-panel px-3.5 py-2.5 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease-sigap placeholder:text-muted/70 focus-visible:border-daun-500 focus-visible:ring-2 focus-visible:ring-fokus focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

const GAYA_ISIAN_GALAT =
  "border-danger focus-visible:border-danger focus-visible:ring-danger";

export function Input({
  className,
  galat,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { galat?: boolean }) {
  return (
    <input
      aria-invalid={galat || undefined}
      className={cn(GAYA_ISIAN, galat && GAYA_ISIAN_GALAT, className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  galat,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { galat?: boolean }) {
  return (
    <textarea
      aria-invalid={galat || undefined}
      className={cn(GAYA_ISIAN, galat && GAYA_ISIAN_GALAT, className)}
      {...props}
    />
  );
}

export function Select({
  className,
  galat,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { galat?: boolean }) {
  return (
    <select
      aria-invalid={galat || undefined}
      className={cn(
        GAYA_ISIAN,
        "appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2356655e%22 stroke-width=%222.5%22 stroke-linecap=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')]",
        galat && GAYA_ISIAN_GALAT,
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-mikro font-semibold uppercase text-muted",
        className
      )}
      {...props}
    />
  );
}

/**
 * Mengikat label, kontrol, pesan bantuan, dan pesan galat secara otomatis.
 * Sebelumnya tiap form mengarang polanya sendiri dan asosiasi label-input
 * tidak dijamin.
 */
export function Field({
  label,
  bantuan,
  galat,
  wajib,
  children,
  className,
}: {
  label: string;
  bantuan?: string;
  galat?: string;
  wajib?: boolean;
  children: (props: {
    id: string;
    galat: boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const idBantuan = `${id}-bantuan`;
  const idGalat = `${id}-galat`;
  const describedBy =
    [galat ? idGalat : null, bantuan ? idBantuan : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {wajib && (
          <span className="ml-1 text-danger" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children({ id, galat: Boolean(galat), "aria-describedby": describedBy })}
      {bantuan && !galat && (
        <p id={idBantuan} className="mt-1.5 text-xs text-muted">
          {bantuan}
        </p>
      )}
      {galat && (
        <p
          id={idGalat}
          className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-danger-kuat dark:text-red-300"
        >
          <span aria-hidden>▲</span>
          {galat}
        </p>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: StatusKey }) {
  const s = STATUS[status] ?? STATUS.baru;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-kontrol px-2.5 py-1 text-xs font-semibold",
        s.chip
      )}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: s.warna }}
        aria-hidden
      />
      {s.label}
    </span>
  );
}

export function Avatar({
  nama,
  url,
  ukuran = 36,
}: {
  nama: string;
  url?: string | null;
  ukuran?: number;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Foto profil ${nama}`}
        width={ukuran}
        height={ukuran}
        className="rounded-full object-cover"
        style={{ width: ukuran, height: ukuran }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-daun-600 font-display font-bold text-white"
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.38 }}
    >
      {inisial(nama || "?")}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-item bg-line/60 dark:bg-line", className)}
    />
  );
}

/** Skeleton berbentuk konten, bukan blok abu — supaya bentuk yang datang terbaca. */
export function SkeletonKartu({ jumlah = 3 }: { jumlah?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Memuat…</span>
      {Array.from({ length: jumlah }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-full" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-20 rounded-kontrol" />
            <Skeleton className="h-5 w-10 rounded-kontrol" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Satu bentuk empty state untuk seluruh aplikasi. Sebelumnya ada 11 varian
 * copy-paste, delapan di antaranya cuma satu kalimat abu tanpa jalan keluar.
 * Empty state selalu punya jalan keluar.
 */
export function KosongState({
  ikon,
  judul,
  isi,
  aksi,
  className,
}: {
  ikon?: React.ReactNode;
  judul: string;
  isi?: string;
  aksi?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-12 text-center",
        className
      )}
    >
      {ikon && (
        <span
          aria-hidden
          className="mb-4 flex size-14 items-center justify-center rounded-panel bg-panel-2 text-muted"
        >
          {ikon}
        </span>
      )}
      <p className="font-display text-lg font-bold">{judul}</p>
      {isi && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted teks-pretty">
          {isi}
        </p>
      )}
      {aksi && <div className="mt-5 flex flex-wrap justify-center gap-2">{aksi}</div>}
    </div>
  );
}

/**
 * Baris KPI dipakai di /transparansi dan /dewan dengan markup yang identik
 * karakter demi karakter. Diekstrak, dan defaultnya NETRAL — warna hanya
 * muncul kalau angkanya memang bermakna (mis. SLA terlampaui).
 */
export function KartuKpi({
  label,
  nilai,
  satuan,
  ikon,
  nada = "netral",
  catatan,
}: {
  label: string;
  nilai: React.ReactNode;
  satuan?: string;
  ikon?: React.ReactNode;
  nada?: "netral" | "baik" | "waspada" | "bahaya";
  catatan?: string;
}) {
  const nadaKelas = {
    netral: "bg-panel-2 text-ink-2",
    baik: "bg-daun-500/12 text-daun-700 dark:text-daun-300",
    waspada: "bg-kunyit-500/15 text-kunyit-800 dark:text-kunyit-400",
    bahaya: "bg-danger/12 text-danger-kuat dark:text-red-300",
  }[nada];

  return (
    <Card className="flex items-center gap-3.5 p-4">
      {ikon && (
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-item",
            nadaKelas
          )}
        >
          {ikon}
        </span>
      )}
      <div className="min-w-0">
        <p className="angka-tabular font-display text-2xl font-extrabold leading-none">
          {nilai}
          {satuan && (
            <span className="ml-1 text-sm font-semibold text-muted">
              {satuan}
            </span>
          )}
        </p>
        <p className="mt-1.5 text-xs text-muted">{label}</p>
        {catatan && (
          <p className="mt-0.5 text-mikro font-semibold uppercase text-muted">
            {catatan}
          </p>
        )}
      </div>
    </Card>
  );
}
