"use client";

import { useState } from "react";
import { MoveHorizontal } from "lucide-react";

export function SebelumSesudah({
  sebelum,
  sesudah,
}: {
  sebelum: string;
  sesudah: string;
}) {
  const [posisi, setPosisi] = useState(50);

  return (
    <div className="relative overflow-hidden rounded-2xl border garis-halus select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sesudah}
        alt="Kondisi sesudah ditangani"
        className="h-72 w-full object-cover sm:h-80"
        draggable={false}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${posisi}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sebelum}
          alt="Kondisi sebelum ditangani"
          className="h-72 w-full object-cover sm:h-80"
          style={{ width: "100%" , maxWidth: "none" }}
          draggable={false}
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          Sebelum
        </span>
      </div>
      <span className="absolute right-3 top-3 rounded-full bg-daun-600/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
        Sesudah
      </span>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        style={{ left: `${posisi}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-daun-600 text-white shadow-lg">
          <MoveHorizontal size={16} />
        </span>
      </span>

      <input
        type="range"
        min={0}
        max={100}
        value={posisi}
        onChange={(e) => setPosisi(Number(e.target.value))}
        aria-label="Geser perbandingan sebelum dan sesudah"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        Geser untuk membandingkan
      </div>
    </div>
  );
}
