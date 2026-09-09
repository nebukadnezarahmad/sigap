import { cn } from "@/lib/utils";

// Bilah progres HIG: role=progressbar + aria-valuenow/min/max + aria-label.
// Warna action (biru) untuk progres umum; hijau hanya untuk konteks data
// (kuis/polling/poin) — pakai `varian="data"` bila memang konteks data.
// Contoh pakai:
//   <Progress nilai={40} label="Mengunggah foto" />
export function Progress({
  nilai,
  maks = 100,
  label,
  varian = "aksi",
  className,
}: {
  nilai: number;
  maks?: number;
  label: string;
  varian?: "aksi" | "data";
  className?: string;
}) {
  const atas = Math.max(1, maks);
  const dijepit = Math.max(0, Math.min(atas, nilai));
  const persen = (dijepit / atas) * 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(dijepit)}
      aria-valuemin={0}
      aria-valuemax={atas}
      aria-label={label}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-panel-2",
        className
      )}
    >
      <div
        aria-hidden="true"
        style={{ width: `${persen}%` }}
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          varian === "data" ? "bg-daun-500" : "bg-action"
        )}
      />
    </div>
  );
}
