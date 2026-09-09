"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Kolom pencarian HIG: <label> selalu persisten (sr-only agar tidak
// menggandakan placeholder), input type="search", tombol bersih saat ada nilai.
// Contoh pakai:
//   <SearchField label="Cari layanan" placeholder="Cari layanan…"
//     nilai={kueri} onUbah={setKueri} />
export function SearchField({
  label,
  placeholder,
  nilai,
  onUbah,
  onBersihkan,
  className,
}: {
  label: string;
  placeholder?: string;
  nilai: string;
  onUbah: (nilai: string) => void;
  onBersihkan?: () => void;
  className?: string;
}) {
  const id = useId();

  function bersihkan() {
    onUbah("");
    onBersihkan?.();
  }

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        id={id}
        type="search"
        value={nilai}
        placeholder={placeholder ?? label}
        onChange={(e) => onUbah(e.target.value)}
        className="w-full rounded-xl border garis-halus bg-panel py-2.5 pl-10 pr-10 text-sm outline-none transition placeholder:text-muted/70 focus:border-action focus:ring-4 focus:ring-action/15"
      />
      {nilai.length > 0 && (
        <button
          type="button"
          onClick={bersihkan}
          aria-label="Bersihkan pencarian"
          className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
