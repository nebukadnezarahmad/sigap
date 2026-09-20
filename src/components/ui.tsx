import { Loader2 } from "lucide-react";
import { cn, inisial } from "@/lib/utils";
import { STATUS, type StatusKey } from "@/lib/constants";

export function Button({
  variant = "utama",
  size = "md",
  loading = false,
  loadingLabel,
  disabled,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "utama" | "sekunder" | "hantu" | "bahaya";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingLabel?: string;
}) {
  const sibuk = loading === true;
  return (
    <button
      disabled={Boolean(disabled) || sibuk}
      aria-busy={sibuk || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
        size === "sm" && "min-h-[44px] px-3.5 py-1.5 text-sm",
        size === "md" && "min-h-[44px] px-5 py-2.5 text-sm",
        size === "lg" && "min-h-[44px] px-7 py-3 text-base",
        variant === "utama" &&
          "bg-action text-[var(--on-action)] shadow-[0_1px_2px_rgb(0_102_204/0.25),0_6px_16px_-6px_rgb(0_102_204/0.4)] hover:bg-action-hover hover:shadow-[0_2px_4px_rgb(0_102_204/0.25),0_10px_24px_-6px_rgb(0_102_204/0.45)]",
        variant === "sekunder" &&
          "border garis-halus bg-panel text-ink hover:border-action hover:text-action",
        variant === "hantu" && "text-muted hover:bg-panel-2 hover:text-ink",
        variant === "bahaya" &&
          "bg-danger/10 text-danger hover:bg-danger hover:text-white",
        className
      )}
      {...props}
    >
      {sibuk && (
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      )}
      {sibuk ? (loadingLabel ?? children) : children}
    </button>
  );
}

export function IconButton({
  ukuran = "md",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  // Nama aksesibel wajib: pemakai harus mengisi aria-label.
  "aria-label": string;
  ukuran?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
        ukuran === "sm" && "size-11 min-h-[44px] min-w-[44px]",
        ukuran === "md" && "size-11 min-h-[44px] min-w-[44px]",
        ukuran === "lg" && "size-12",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  variant: _varian = "datar",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  // Dipertahankan untuk kompatibilitas API; visual selalu garis saja (tanpa bayangan).
  variant?: "datar" | "melayang";
}) {
  void _varian;
  return (
    <div
      className={cn("rounded-xl border garis-halus bg-panel", className)}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border garis-halus bg-panel px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-action focus:ring-4 focus:ring-action/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border garis-halus bg-panel px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-action focus:ring-4 focus:ring-action/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full appearance-none rounded-xl border garis-halus bg-panel px-3.5 py-2.5 text-sm outline-none transition focus:border-action focus:ring-4 focus:ring-action/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action",
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
      className={cn("mb-1.5 block text-xs font-semibold text-muted", className)}
      {...props}
    />
  );
}

export function StatusChip({ status }: { status: StatusKey }) {
  const s = STATUS[status] ?? STATUS.baru;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        s.chip
      )}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: s.warna }}
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
      className="flex shrink-0 items-center justify-center rounded-full bg-panel-2 font-display font-bold text-muted"
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.38 }}
    >
      {inisial(nama || "?")}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-xl bg-line/60 dark:bg-line",
        className
      )}
    />
  );
}

// Varian skeleton HIG: setiap varian me-render `role="status"` dengan
// `aria-label` agar pembaca layar mengumumkan status muat, sementara bentuk
// visualnya disembunyikan (`aria-hidden`).
// Contoh pakai langsung (label bawaan "Memuat konten…"):
//   <SkeletonTeks baris={3} />
// Contoh dengan label khusus:
//   <SkeletonKartu label="Memuat laporan…" />
export function SkeletonTeks({
  baris = 3,
  label = "Memuat konten…",
  className,
}: {
  baris?: number;
  label?: string;
  className?: string;
}) {
  const jumlah = Math.max(1, Math.min(6, Math.floor(baris)));
  return (
    <div role="status" aria-label={label} className={cn("space-y-2", className)}>
      <div aria-hidden="true" className="space-y-2">
        {Array.from({ length: jumlah }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-3",
              i === jumlah - 1 ? "w-3/5" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonKartu({
  label = "Memuat konten…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-label={label} className={cn("rounded-xl border garis-halus bg-panel p-4", className)}>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGrafik({
  label = "Memuat konten…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const tinggi = ["40%", "65%", "50%", "80%", "60%"];
  return (
    <div role="status" aria-label={label} className={cn("rounded-xl border garis-halus bg-panel p-4", className)}>
      <div aria-hidden="true" className="flex h-32 items-end gap-2">
        {tinggi.map((t, i) => (
          <div
            key={i}
            className="w-full animate-pulse rounded-lg bg-line/60 dark:bg-line"
            style={{ height: t }}
          />
        ))}
      </div>
    </div>
  );
}
