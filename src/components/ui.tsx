import { cn, inisial } from "@/lib/utils";
import { STATUS, type StatusKey } from "@/lib/constants";

export function Button({
  variant = "utama",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "utama" | "sekunder" | "hantu" | "bahaya";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background-color,border-color,color,opacity] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus disabled:pointer-events-none disabled:opacity-50 active:scale-[0.95] motion-reduce:transition-none motion-reduce:active:scale-100",
        size === "sm" && "px-3.5 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3 text-base",
        variant === "utama" &&
          "bg-ap-blue text-white hover:bg-ap-blue-focus",
        variant === "sekunder" &&
          "border border-ap-hairline bg-ap-canvas text-ap-ink hover:border-ap-blue hover:text-ap-blue",
        variant === "hantu" &&
          "text-ap-ink-muted hover:bg-ap-elevated hover:text-ap-ink",
        variant === "bahaya" &&
          "bg-ap-danger/10 text-ap-danger hover:bg-ap-danger hover:text-white",
        className
      )}
      {...props}
    />
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
      className={cn("rounded-xl border border-ap-hairline bg-ap-panel", className)}
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
        "min-h-[44px] w-full rounded-xl border border-ap-hairline bg-ap-canvas px-3.5 py-2.5 text-sm text-ap-ink outline-none transition-[background-color,border-color,box-shadow,color] duration-200 ease-out placeholder:text-ap-ink-muted/70 focus:border-ap-blue focus:ring-4 focus:ring-ap-blue/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus motion-reduce:transition-none",
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
        "min-h-[44px] w-full rounded-xl border border-ap-hairline bg-ap-canvas px-3.5 py-2.5 text-sm text-ap-ink outline-none transition-[background-color,border-color,box-shadow,color] duration-200 ease-out placeholder:text-ap-ink-muted/70 focus:border-ap-blue focus:ring-4 focus:ring-ap-blue/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus motion-reduce:transition-none",
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
        "min-h-[44px] w-full appearance-none rounded-xl border border-ap-hairline bg-ap-canvas px-3.5 py-2.5 text-sm text-ap-ink outline-none transition-[background-color,border-color,box-shadow,color] duration-200 ease-out focus:border-ap-blue focus:ring-4 focus:ring-ap-blue/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-blue-focus motion-reduce:transition-none",
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
      className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted", className)}
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
        alt={nama}
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
      className="flex shrink-0 items-center justify-center rounded-full bg-ap-blue font-display font-bold text-white"
      style={{ width: ukuran, height: ukuran, fontSize: ukuran * 0.38 }}
    >
      {inisial(nama || "?")}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-ap-hairline/60 motion-reduce:animate-none",
        className
      )}
    />
  );
}
