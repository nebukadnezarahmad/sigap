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
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-daun-600 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
        size === "sm" && "px-3.5 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3 text-base",
        variant === "utama" &&
          "bg-daun-600 text-white shadow-[0_1px_2px_rgb(23_67_42/0.2),0_6px_16px_-6px_rgb(23_67_42/0.35)] hover:bg-daun-700 hover:shadow-[0_2px_4px_rgb(23_67_42/0.2),0_10px_24px_-6px_rgb(23_67_42/0.4)]",
        variant === "sekunder" &&
          "border garis-halus bg-panel text-ink hover:border-daun-400 hover:text-daun-700 dark:hover:text-daun-300",
        variant === "hantu" && "text-muted hover:bg-panel-2 hover:text-ink",
        variant === "bahaya" &&
          "bg-danger/10 text-danger hover:bg-danger hover:text-white",
        className
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border garis-halus bg-panel shadow-[0_1px_2px_rgb(23_67_42/0.05),0_6px_20px_-10px_rgb(23_67_42/0.1)]",
        className
      )}
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
        "w-full rounded-xl border garis-halus bg-panel px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-daun-500 focus:ring-4 focus:ring-daun-500/15",
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
        "w-full rounded-xl border garis-halus bg-panel px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-daun-500 focus:ring-4 focus:ring-daun-500/15",
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
        "w-full appearance-none rounded-xl border garis-halus bg-panel px-3.5 py-2.5 text-sm outline-none transition focus:border-daun-500 focus:ring-4 focus:ring-daun-500/15",
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
      className={cn(
        "animate-pulse rounded-xl bg-line/60 dark:bg-line",
        className
      )}
    />
  );
}
