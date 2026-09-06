import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// Pola meniru liquid-glass-js (container.js): kaca = snapshot buram di belakang
// permukaan + tint + sorotan tepi. Di sini cukup CSS: backdrop-filter
// blur(20px) saturate(180%), lapisan translucent, specular edge 1px
// rgba(255,255,255,.35). Sengaja tanpa WebGL/canvas: murah, SSR-aman,
// dan konsisten dengan token terang+gelap repo ini.
// Prinsip pakai: hanya untuk bar interaktif/toolbar/kartu terapung,
// bukan seluruh halaman. Tanpa animasi/shimmer sehingga aman untuk
// prefers-reduced-motion (globals.css juga sudah menonaktifkan transisi
// saat reduced-motion). Kontras: teks memakai text-ink di atas lapisan
// translucent terang+gelap yang sudah diuji dua mode.

const FILTER_KACA: CSSProperties = {
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
};

const GAYA_SPEKULAR: CSSProperties = {
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 8px 24px -12px rgb(0 0 0 / 0.25)",
};

type KacaBarProps = HTMLAttributes<HTMLElement> & {
  as?: "header" | "div";
};

export function KacaBar({
  as = "div",
  className,
  style,
  ...props
}: KacaBarProps) {
  const Tag = as as "div";
  return (
    <Tag
      style={{ ...FILTER_KACA, ...GAYA_SPEKULAR, ...style }}
      className={cn(
        "sticky top-0 z-[900] border-b border-white/40 bg-paper/70 text-ink",
        "dark:border-white/15 dark:bg-[#0c1310]/60",
        "motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  );
}

export function KacaKartu({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ ...FILTER_KACA, ...GAYA_SPEKULAR, ...style }}
      className={cn(
        "rounded-[18px] border border-white/40 bg-white/60 text-ink",
        "dark:border-white/15 dark:bg-[#131d19]/55",
        "motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  );
}

type KacaPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  berkilau?: boolean;
};

export function KacaPill({
  berkilau = false,
  className,
  style,
  children,
  ...props
}: KacaPillProps) {
  return (
    <button
      style={{ ...FILTER_KACA, ...GAYA_SPEKULAR, ...style }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full",
        "border border-white/40 bg-white/60 px-5 py-2.5 text-sm font-semibold text-ink",
        "transition-[transform,background-color,border-color,box-shadow,color] duration-300",
        "hover:bg-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-daun-600",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        "dark:border-white/15 dark:bg-white/10 dark:text-ink dark:hover:bg-white/15",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}
      {...props}
    >
      {berkilau ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent opacity-60 motion-reduce:hidden"
        />
      ) : null}
      <span className="relative">{children}</span>
    </button>
  );
}
